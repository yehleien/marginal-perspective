const express = require('express');
const router = express.Router();
const { Perspective, UserPerspective, User, sequelize } = require('../models');
const { Op } = require('sequelize');
//const DEFAULT_PERSPECTIVES = require('../config/perspectives');

router.get('/get_perspectives/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const perspectives = await UserPerspective.findAll({
            where: { userId },
            include: [{
                model: Perspective,
                attributes: ['perspectiveId', 'perspectiveName', 'type']
            }],
            attributes: ['value']
        });

        // Transform the data to include both perspective info and value
        const formattedPerspectives = perspectives.map(p => ({
            perspectiveId: p.Perspective.perspectiveId,
            perspectiveName: `${p.Perspective.perspectiveName}: ${p.value}`,
            type: p.Perspective.type,
            value: p.value
        }));

        console.log('Found perspectives:', formattedPerspectives);
        res.json(formattedPerspectives);
    } catch (error) {
        console.error('Error fetching perspectives:', error);
        res.status(500).json({ error: 'Failed to fetch perspectives' });
    }
});

router.post('/add_perspective', async (req, res) => {
    try {
        const { perspectiveName, userId } = req.body;

        const perspective = await Perspective.create({ 
            perspectiveName,
            type: 'custom',
            verificationMethod: 'self-reported',
            verificationStatus: 'pending'
        });

        await UserPerspective.create({
            userId,
            perspectiveId: perspective.perspectiveId
        });

        res.json({ success: true, perspective });
    } catch (error) {
        console.error('Error during perspective creation:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.post('/update', async (req, res) => {
    try {
        const { userId, perspectiveName, type } = req.body;
        
        const userPerspective = await UserPerspective.findOne({
            include: [{
                model: Perspective,
                where: { perspectiveName }
            }],
            where: { userId }
        });

        if (!userPerspective) {
            return res.status(404).json({ error: 'Perspective not found' });
        }

        await Perspective.update({
            type,
            verificationStatus: 'pending'
        }, {
            where: { perspectiveId: userPerspective.perspectiveId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating perspective:', error);
        res.status(500).json({ error: 'Failed to update perspective' });
    }
});

router.get('/by-ids', async (req, res) => {
    try {
        const ids = req.query.ids.split(',');
        const perspectives = await Perspective.findAll({
            where: {
                perspectiveId: {
                    [Op.in]: ids
                }
            },
            attributes: ['perspectiveId', 'perspectiveName']
        });
        res.json(perspectives);
    } catch (error) {
        console.error('Error fetching perspectives by ids:', error);
        res.status(500).json({ error: 'Failed to fetch perspectives' });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { perspectives } = req.body;
        const results = [];

        for (const perspective of perspectives) {
            const [perspectiveRecord] = await Perspective.findOrCreate({
                where: { 
                    perspectiveName: perspective.name,
                    type: perspective.type
                },
                defaults: {
                    type: perspective.type,
                    categoryType: perspective.categoryType,
                    verificationMethod: 'self-reported'
                }
            });

            const [userPerspective] = await UserPerspective.findOrCreate({
                where: {
                    userId,
                    perspectiveId: perspectiveRecord.perspectiveId
                },
                defaults: {
                    value: perspective.value,
                    source: perspective.source,
                    verificationStatus: 'verified'
                }
            });

            if (userPerspective.value !== perspective.value) {
                await userPerspective.update({
                    value: perspective.value,
                    source: perspective.source,
                    verificationStatus: 'verified'
                });
            }

            results.push(userPerspective);
        }

        res.json({ success: true, perspectives: results });
    } catch (error) {
        console.error('Error generating perspectives:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;