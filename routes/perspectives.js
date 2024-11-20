const express = require('express');
const router = express.Router();
const { Perspective, User, sequelize } = require('../models');

router.get('/get_perspectives/:userId', (req, res) => {
    const userId = req.params.userId;
    Perspective.findAll({ where: { userId }, 
    attributes: ['perspectiveId', 'userId', 'perspectiveName', 'type', 'options', 'createdAt', 'updatedAt']
    })
        .then(perspectives => {
            res.json(perspectives);
        })
        .catch(error => {
            console.error('Error:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

router.post('/add_perspective', (req, res) => {
    const { perspectiveName, userId } = req.body;

    Perspective.create({ perspectiveName, userId })
        .then(perspective => {
            res.json({ success: true, perspective });
        })
        .catch(error => {
            console.error('Error during perspective creation:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

router.put('/update_perspective/:perspectiveId', (req, res) => {
    const { perspectiveName, perspectiveType } = req.body;
    const perspectiveId = req.params.perspectiveId;

    Perspective.update({ perspectiveName, type: perspectiveType }, { where: { perspectiveId } })
        .then(() => {
            res.json({ success: true });
        })
        .catch(error => {
            console.error('Error during perspective update:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

router.delete('/delete_perspective/:id', (req, res) => {
    const id = req.params.id;

    Perspective.destroy({ where: { id } })
        .then(() => {
            res.json({ success: true });
        })
        .catch(error => {
            console.error('Error during perspective deletion:', error);
            res.json({ success: false, error: 'Server error' });
        });
});



  // Route to get all perspectives
router.get('/get_all_perspectives', (req, res) => {
    Perspective.findAll({
        attributes: ['perspectiveId', 'perspectiveName', 'type', 'options'] // Adjust attributes as needed
    })
    .then(perspectives => {
        res.json(perspectives);
    })
    .catch(error => {
        console.error('Error fetching perspectives:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    });
});


// Add this new route to get perspectives by IDs
router.post('/get_perspectives_by_ids', async (req, res) => {
    try {
        const { perspectiveIds } = req.body;
        const perspectives = await Perspective.findAll({
            where: {
                perspectiveId: {
                    [sequelize.Op.in]: perspectiveIds
                }
            },
            attributes: ['perspectiveId', 'perspectiveName']
        });
        res.json(perspectives);
    } catch (error) {
        console.error('Error fetching perspectives by IDs:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.get('/insights', async (req, res) => {
    try {
        const insights = await Perspective.findAll({
            attributes: [
                'perspectiveId',
                'perspectiveName',
                [
                    sequelize.literal(`(
                        SELECT COUNT(DISTINCT "UserPerspective"."userId")
                        FROM "UserPerspectives" AS "UserPerspective"
                        WHERE "UserPerspective"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'userCount'
                ],
                [
                    sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "Comments" AS "Comment"
                        WHERE "Comment"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'commentCount'
                ],
                [
                    sequelize.literal(`(
                        SELECT COALESCE(SUM(COALESCE("Comment"."upvotes", 0)), 0)
                        FROM "Comments" AS "Comment"
                        WHERE "Comment"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'upvotes'
                ],
                [
                    sequelize.literal(`(
                        SELECT COALESCE(SUM(COALESCE("Comment"."downvotes", 0)), 0)
                        FROM "Comments" AS "Comment"
                        WHERE "Comment"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'downvotes'
                ]
            ],
            order: [['perspectiveName', 'ASC']]
        });
        res.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/details/:perspectiveId', async (req, res) => {
    try {
        const perspective = await Perspective.findOne({
            where: { perspectiveId: req.params.perspectiveId },
            attributes: [
                'perspectiveId',
                'perspectiveName',
                'verificationMethod',
                'verificationDate',
                'activityScore',
                'expertiseYears',
                'organization',
                'verificationStatus',
                [
                    sequelize.literal(`(
                        SELECT COUNT(DISTINCT "UserPerspective"."userId")
                        FROM "UserPerspectives" AS "UserPerspective"
                        WHERE "UserPerspective"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'userCount'
                ],
                [
                    sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "Comments" AS "Comment"
                        WHERE "Comment"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'commentCount'
                ],
                [
                    sequelize.literal(`(
                        SELECT COALESCE(AVG(COALESCE("Comment"."upvotes", 0)), 0)::float
                        FROM "Comments" AS "Comment"
                        WHERE "Comment"."perspectiveId" = "Perspective"."perspectiveId"
                    )`),
                    'avgUpvotes'
                ]
            ]
        });

        if (!perspective) {
            return res.status(404).json({ error: 'Perspective not found' });
        }

        // Convert avgUpvotes to a number if it's not already
        const responseData = perspective.toJSON();
        responseData.avgUpvotes = Number(responseData.avgUpvotes) || 0;

        console.log('Sending perspective data:', responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching perspective details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;