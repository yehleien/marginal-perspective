const express = require('express');
const router = express.Router();
const { Comment, User, Perspective, Article, Vote, UserPerspective } = require('../models');
const sequelize = require('sequelize');
const { Op } = require('sequelize');

router.get('/comments/:articleId', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { articleId: req.params.articleId },
            include: [
                {
                    model: Perspective,
                    as: 'Perspective', 
                    attributes: ['perspectiveId', 'perspectiveName', 'type']
                }
            ]
        });
        
        // Get the UserPerspective values separately
        const commentUserIds = comments.map(c => c.userId);
        const commentPerspectiveIds = comments.map(c => c.perspectiveId);
        const userPerspectives = await UserPerspective.findAll({
            where: { 
                perspectiveId: { [Op.in]: commentPerspectiveIds },
                userId: { [Op.in]: commentUserIds }
            },
            include: [{
                model: Perspective,
                attributes: ['perspectiveId', 'perspectiveName', 'type']
            }]
        });

        // Create a map of perspectiveId+userId to perspective data
        const perspectiveMap = new Map();
        userPerspectives.forEach(up => {
            perspectiveMap.set(`${up.perspectiveId}-${up.userId}`, {
                perspectiveId: up.perspectiveId,
                perspectiveName: up.Perspective.perspectiveName,
                type: up.Perspective.type,
                value: up.value
            });
        });
        
        // Transform the comments to include the perspective data
        const transformedComments = comments.map(comment => {
            const rawComment = comment.toJSON();
            const perspectiveData = perspectiveMap.get(`${comment.perspectiveId}-${comment.userId}`);
            return {
                ...rawComment,
                perspectiveValue: perspectiveData ? perspectiveData.value : null,
                Perspective: {
                    ...rawComment.Perspective,
                    value: perspectiveData ? perspectiveData.value : null
                }
            };
        });
        
        console.log('Comments being sent:', transformedComments);
        
        res.json(transformedComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

router.get('/comment/:commentId', async (req, res) => {
    try {
        const comment = await Comment.findOne({
            where: { id: req.params.commentId },
            include: [
                {
                    model: Perspective,
                    as: 'Perspective', 
                    attributes: ['perspectiveName']
                },
                {
                    model: Vote,
                    as: 'votes',
                    attributes: ['userId', 'is_upvote']
                }
            ]
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.upvotes = comment.votes.filter(vote => vote.is_upvote).length;
        comment.downvotes = comment.votes.filter(vote => !vote.is_upvote).length;

        res.json(comment);
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to create a new comment
router.post('/submit_comment', async (req, res) => {
    const { articleId, commentText, userId, perspectiveId, parentID } = req.body;

    try {
        // Validate input data
        if (!articleId || !commentText || !userId || !perspectiveId) {
            return res.status(400).send('Missing required fields');
        }

        // Fetch the perspective name for the new comment's perspectiveId
        const newCommentPerspective = await Perspective.findByPk(perspectiveId);
        if (!newCommentPerspective) {
            return res.status(404).send('Perspective not found.');
        }

        // If there's a parentID, verify the perspective names match
        if (parentID) {
            const parentComment = await Comment.findByPk(parentID, {
                include: [{
                    model: Perspective,
                    as: 'Perspective'
                }]
            });
            if (!parentComment) {
                return res.status(404).send('Parent comment not found.');
            }
            if (!parentComment.Perspective || newCommentPerspective.perspectiveName !== parentComment.Perspective.perspectiveName) {
                return res.status(403).send('Cannot reply to a comment from a different perspective.');
            }
            // Increment the parent's replyCount
            await Comment.increment('replyCount', { where: { id: parentID } });
        }

        // Create the comment with the validated perspective name and parentID (if provided)
        const newComment = await Comment.create({
            text: commentText,
            articleId: articleId,
            userId: userId,
            perspectiveId: perspectiveId, // This is still needed for record-keeping
            parentID: parentID || null
        });

        newComment.upvotes = 0;
        newComment.downvotes = 0;

        res.status(201).json(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// POST route to upvote a comment
router.post('/upvote/:commentId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { commentId } = req.params;

        const comment = await Comment.findByPk(commentId, {
            include: [{ model: Perspective, as: 'Perspective' }]
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (!comment.Perspective) {
            return res.status(400).json({ message: 'Comment has no associated perspective' });
        }

        // Check if the user has the required perspective
        const userPerspective = await UserPerspective.findOne({
            where: { userId, perspectiveId: comment.Perspective.perspectiveId }
        });

        if (!userPerspective) {
            return res.status(403).json({ message: 'You do not have the required perspective to vote on this comment' });
        }

        const existingVote = await Vote.findOne({ where: { userId, commentId } });

        if (existingVote) {
            if (existingVote.is_upvote) {
                await existingVote.destroy();
                await comment.decrement('upvotes');
            } else {
                existingVote.is_upvote = true;
                await existingVote.save();
                await comment.decrement('downvotes');
                await comment.increment('upvotes');
            }
        } else {
            await Vote.create({ userId, commentId, is_upvote: true });
            await comment.increment('upvotes');
        }

        await comment.reload();
        res.json({ success: true, upvotes: comment.upvotes, downvotes: comment.downvotes });
    } catch (error) {
        console.error('Error upvoting comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST route to downvote a comment
router.post('/downvote/:commentId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { commentId } = req.params;

        const comment = await Comment.findByPk(commentId, {
            include: [{ model: Perspective, as: 'Perspective' }]
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (!comment.Perspective) {
            return res.status(400).json({ message: 'Comment has no associated perspective' });
        }

        // Check if the user has the required perspective
        const userPerspective = await UserPerspective.findOne({
            where: { userId, perspectiveId: comment.Perspective.perspectiveId }
        });

        if (!userPerspective) {
            return res.status(403).json({ message: 'You do not have the required perspective to vote on this comment' });
        }

        const existingVote = await Vote.findOne({ where: { userId, commentId } });

        if (existingVote) {
            if (!existingVote.is_upvote) {
                await existingVote.destroy();
                await comment.decrement('downvotes');
            } else {
                existingVote.is_upvote = false;
                await existingVote.save();
                await comment.decrement('upvotes');
                await comment.increment('downvotes');
            }
        } else {
            await Vote.create({ userId, commentId, is_upvote: false });
            await comment.increment('downvotes');
        }

        await comment.reload();
        res.json({ success: true, upvotes: comment.upvotes, downvotes: comment.downvotes });
    } catch (error) {
        console.error('Error downvoting comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/replies/:id', async (req, res) => {
    const parentID = req.params.id;

    // Fetch the replies from the database
    const replies = await Comment.findAll({
        where: { parentID },
        order: [['createdAt', 'DESC']] // Order the replies by creation date
    });

    res.json(replies);
});

router.get('/commentCount/:articleId', async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const commentCount = await Comment.count({
            where: { articleId: articleId }
        });
        res.json({ articleId: articleId, commentCount: commentCount });
    } catch (error) {
        console.error('Error fetching comment count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this new route to get comments for an article
router.get('/get_comments/:articleId', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { articleId: req.params.articleId },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['username']
                },
                {
                    model: Perspective,
                    as: 'Perspective',
                    attributes: ['perspectiveName']
                }
            ]
        });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/user_comments', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { userId: req.user.id },
            include: [{ model: Perspective }],
            order: [['createdAt', 'DESC']]
        });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching user comments:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/get_user_comments', async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const comments = await Comment.findAll({
            where: { userId: req.session.userId },
            include: [
                { 
                    model: Perspective,
                    as: 'Perspective',
                    attributes: ['perspectiveName']
                },
                {
                    model: Article,
                    as: 'article',
                    attributes: ['id', 'title']
                }
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching user comments:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;