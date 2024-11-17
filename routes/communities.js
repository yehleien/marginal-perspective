const express = require('express');
const router = express.Router();
const { User, Perspective, UserPerspective, CommunityPost } = require('../models');
const { Sequelize } = require('sequelize');

// Get community statistics
router.get('/stats/:perspectiveId', async (req, res) => {
    try {
        const perspectiveId = req.params.perspectiveId;
        
        const [memberCount, postCount, activeToday] = await Promise.all([
            UserPerspective.count({
                where: { perspectiveId }
            }),
            CommunityPost.count({
                where: { perspectiveId }
            }),
            UserPerspective.count({
                where: {
                    perspectiveId,
                    updatedAt: {
                        [Sequelize.Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        
        res.json({ memberCount, postCount, activeToday });
    } catch (error) {
        console.error('Error getting community stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get community posts
router.get('/posts/:perspectiveId', async (req, res) => {
    try {
        const posts = await CommunityPost.findAll({
            where: { perspectiveId: req.params.perspectiveId },
            order: [['createdAt', 'DESC']],
            limit: 50,
            attributes: ['id', 'content', 'createdAt']
        });
        
        res.json(posts);
    } catch (error) {
        console.error('Error getting community posts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new post
router.post('/create_post', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { content, perspectiveId } = req.body;
        
        // Verify user has access to this perspective
        const hasAccess = await UserPerspective.findOne({
            where: {
                userId: req.session.userId,
                perspectiveId
            }
        });
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Not a member of this community' });
        }
        
        const post = await CommunityPost.create({
            content,
            perspectiveId
        });
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 