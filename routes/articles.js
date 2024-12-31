const express = require('express');
const axios = require('axios');
const Sequelize = require('sequelize');
const cheerio = require('cheerio');
const { Article, Perspective, Vote, Comment, sequelize } = require('../models');
const router = express.Router();

// Media bias ratings cache
const biasCache = {
    'nytimes.com': { bias: 'Left-Center', factRating: 'High' },
    'foxnews.com': { bias: 'Right', factRating: 'Mixed' },
    'reuters.com': { bias: 'Center', factRating: 'Very High' },
    'apnews.com': { bias: 'Center', factRating: 'Very High' },
    'wsj.com': { bias: 'Center-Right', factRating: 'High' },
    'theguardian.com': { bias: 'Left-Center', factRating: 'High' },
    'bbc.com': { bias: 'Center', factRating: 'High' },
    'npr.org': { bias: 'Center-Left', factRating: 'Very High' },
    'washingtonpost.com': { bias: 'Left-Center', factRating: 'High' },
    'breitbart.com': { bias: 'Far Right', factRating: 'Mixed' },
    'huffpost.com': { bias: 'Left', factRating: 'Mixed' },
    'dailywire.com': { bias: 'Right', factRating: 'Mixed' },
    'nbcnews.com': { bias: 'Left-Center', factRating: 'High' },
    'cnn.com': { bias: 'Left', factRating: 'Mixed' },
    'nypost.com': { bias: 'Right-Center', factRating: 'Mixed' }
};

// Get media bias for a domain
router.get('/media_bias/:domain', async (req, res) => {
    try {
        const { domain } = req.params;
        const cleanDomain = domain.replace('www.', '').toLowerCase();
        
        if (biasCache[cleanDomain]) {
            res.json(biasCache[cleanDomain]);
        } else {
            // Return a neutral response for unknown sources
            res.json({ bias: 'Unknown', factRating: 'Unrated' });
        }
    } catch (error) {
        console.error('Error getting media bias:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get_latest', async (req, res) => {
    try {
        const index = parseInt(req.query.index) || 0;
        const limit = 27;
        const scope = req.query.scope;

        const queryOptions = {
            order: [['submitDate', 'DESC']],
            offset: index,
            limit: limit
        };

        // Add scope filter if provided and not 'all'
        if (scope && scope !== 'all') {
            queryOptions.where = {
                scope: scope.toLowerCase()
            };
        }

        const articles = await Article.findAll(queryOptions);
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to upvote an article
router.post('/upvote/:articleId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { articleId } = req.params;

        const article = await Article.findByPk(articleId);
        const existingVote = await Vote.findOne({ where: { userId, articleId, is_article_vote: true } });

        if (existingVote) {
            if (existingVote.is_upvote) {
                await existingVote.destroy();
            } else {
                existingVote.is_upvote = true;
                await existingVote.save();
            }
        } else {
            await Vote.create({ userId, articleId, is_upvote: true, is_article_vote: true });
        }

        const upvotesCount = await Vote.count({ where: { articleId, is_upvote: true, is_article_vote: true } });
        const downvotesCount = await Vote.count({ where: { articleId, is_upvote: false, is_article_vote: true } });

        res.json({ success: true, upvotes: upvotesCount, downvotes: downvotesCount });
    } catch (error) {
        console.error('Error upvoting article:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to get vote counts for an article
router.get('/voteCounts/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const upvotesCount = await Vote.count({
            where: { articleId, is_upvote: true, is_article_vote: true }
        });
        const downvotesCount = await Vote.count({
            where: { articleId, is_upvote: false, is_article_vote: true }
        });

        res.json({ success: true, upvotes: upvotesCount, downvotes: downvotesCount });
    } catch (error) {
        console.error('Error fetching vote counts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to downvote an article
router.post('/downvote/:articleId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { articleId } = req.params;

        const article = await Article.findByPk(articleId);
        const existingVote = await Vote.findOne({ where: { userId, articleId, is_article_vote: true } });

        if (existingVote) {
            if (!existingVote.is_upvote) {
                await existingVote.destroy();
            } else {
                existingVote.is_upvote = false;
                await existingVote.save();
            }
        } else {
            await Vote.create({ userId, articleId, is_upvote: false, is_article_vote: true });
        }

        const upvotesCount = await Vote.count({ where: { articleId, is_upvote: true, is_article_vote: true } });
        const downvotesCount = await Vote.count({ where: { articleId, is_upvote: false, is_article_vote: true } });

        res.json({ success: true, upvotes: upvotesCount, downvotes: downvotesCount });
    } catch (error) {
        console.error('Error downvoting article:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/posts/:id', async (req, res) => {
    try {
        const articleId = parseInt(req.params.id, 10);
        console.log('Looking for article:', articleId);
        
        const article = await Article.findByPk(articleId);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        console.log('Found article:', article);
        res.json(article);
    } catch (err) {
        console.error('Detailed error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/submit_article', async (req, res) => {
    try {
        const { url, scope, content, perspectiveId, title: providedTitle } = req.body;
        const submitDate = new Date();

        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Validate scope
        const validScopes = ['news', 'politics', 'healthcare', 'sports', 'technology', 'entertainment', 'business', 'science'];
        if (!scope || !validScopes.includes(scope.toLowerCase())) {
            return res.status(400).json({ message: 'Invalid scope. Must be one of: ' + validScopes.join(', ') });
        }

        // Validate perspectiveID
        if (perspectiveId) {
            const perspectiveExists = await Perspective.findByPk(perspectiveId);
            if (!perspectiveExists) {
                return res.status(400).json({ message: 'Invalid perspectiveID' });
            }
        }

        let title = providedTitle;
        if (url) {
            if (!title) {
                const { data } = await axios.get(url);
                const $ = cheerio.load(data);
                title = $('title').text();
            }
        } else if (!title) {
            return res.status(400).json({ message: 'A title is required if no URL is provided' });
        }

        const newArticle = await Article.create({ 
            url, 
            title, 
            submitDate, 
            scope, 
            content, 
            perspectiveId,
            userId: req.session.userId  // Add the userId from the session
        });
        res.json(newArticle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get_news', async (req, res) => {
    try {
        const articles = await Article.findAll({
            order: [['submitDate', 'DESC']]
        });
        res.json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

async function scrapeAndSubmitArticles() {
    try {
        const { data } = await axios.get('https://text.npr.org/');
        const $ = cheerio.load(data);
        const excludedTitles = ['Culture', 'Music', 'Contact Us', 'Privacy Policy', 'News','Permissions','Terms of Use','Go To Full Site'];

        $('a').each(async (index, element) => {
            const title = $(element).text();
            const url = $(element).attr('href');

            if (excludedTitles.includes(title) || !url) {
                return;
            }

            const fullUrl = 'https://text.npr.org' + url;
            const submitDate = new Date();

            try {
                await Article.findOrCreate({
                    where: { url: fullUrl },
                    defaults: { submitDate, title }
                });
            } catch (error) {
                console.error('Error submitting article:', error);
            }
        });
    } catch (error) {
        console.error('Error scraping articles:', error);
    }
}

router.get('/scrape_and_submit_articles', async (req, res) => {
    try {
        await scrapeAndSubmitArticles();
        res.status(200).json({ message: 'Articles scraped and submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get_user_posts', async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 5;
        
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const posts = await Article.findAll({
            where: { userId: req.session.userId },
            include: [
                { 
                    model: Perspective,
                    as: 'Perspective',
                    attributes: ['perspectiveName']
                }
            ],
            order: [['submitDate', 'DESC']],
            offset,
            limit
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get top perspectives used in comments for a post
router.get('/top_perspectives/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const topPerspectives = await Comment.findAll({
            where: { articleId },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('*')), 'count']
            ],
            include: [{
                model: Perspective,
                as: 'Perspective',
                attributes: ['perspectiveName'],
                required: true
            }],
            group: ['Perspective.perspectiveId', 'Perspective.perspectiveName'],
            order: [[sequelize.fn('COUNT', sequelize.col('*')), 'DESC']],
            limit: 5
        });

        const formattedResults = topPerspectives.map(result => ({
            perspectiveName: result.Perspective.perspectiveName,
            count: parseInt(result.dataValues.count)
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Error getting top perspectives:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;