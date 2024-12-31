const express = require('express');
const router = express.Router();
const { sequelize, Perspective, UserPerspective } = require('../models');

router.post('/generate', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { perspectives } = req.body;
        const results = [];

        for (const perspective of perspectives) {
            try {
                // First find if perspective exists
                let [perspectiveRecord] = await sequelize.query(
                    `SELECT * FROM "Perspectives" 
                     WHERE "perspectiveName" = $1 AND "type" = $2
                     LIMIT 1`,
                    {
                        bind: [perspective.name, perspective.type],
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                // If not exists, create new one
                if (!perspectiveRecord) {
                    [perspectiveRecord] = await sequelize.query(
                        `INSERT INTO "Perspectives" ("perspectiveName", "type", "verificationMethod", "verificationStatus", "activityScore", "createdAt", "updatedAt")
                         VALUES ($1, $2, 'system', 'pending', 0, NOW(), NOW())
                         RETURNING *`,
                        {
                            bind: [perspective.name, perspective.type],
                            type: sequelize.QueryTypes.SELECT
                        }
                    );
                }

                // Check if UserPerspective exists
                let [existingUserPerspective] = await sequelize.query(
                    `SELECT * FROM "UserPerspectives" 
                     WHERE "userId" = $1 AND "perspectiveId" = $2
                     LIMIT 1`,
                    {
                        bind: [userId, perspectiveRecord.perspectiveId],
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                let userPerspective;
                if (existingUserPerspective) {
                    // Update existing with verification
                    [userPerspective] = await sequelize.query(
                        `UPDATE "UserPerspectives" 
                         SET "value" = $3, 
                             "verificationStatus" = $4,
                             "source" = $5,
                             "lastVerifiedAt" = NOW(),
                             "confidence" = $6,
                             "updatedAt" = NOW()
                         WHERE "userId" = $1 AND "perspectiveId" = $2
                         RETURNING *`,
                        {
                            bind: [
                                userId, 
                                perspectiveRecord.perspectiveId, 
                                perspective.value,
                                perspective.verificationStatus || 'unverified',
                                perspective.source || 'self-reported',
                                perspective.confidence || 0.5
                            ],
                            type: sequelize.QueryTypes.SELECT
                        }
                    );
                } else {
                    // Create new with verification
                    [userPerspective] = await sequelize.query(
                        `INSERT INTO "UserPerspectives" 
                         ("userId", "perspectiveId", "value", "source", "verificationStatus", 
                          "confidence", "lastVerifiedAt", "createdAt", "updatedAt")
                         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
                         RETURNING *`,
                        {
                            bind: [
                                userId, 
                                perspectiveRecord.perspectiveId, 
                                perspective.value,
                                perspective.source || 'self-reported',
                                perspective.verificationStatus || 'unverified',
                                perspective.confidence || 0.5
                            ],
                            type: sequelize.QueryTypes.SELECT
                        }
                    );
                }

                results.push(userPerspective);
            } catch (innerError) {
                console.error('Error processing perspective:', perspective, innerError);
            }
        }

        res.json({ success: true, perspectives: results });
    } catch (error) {
        console.error('Error generating perspectives:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const perspectives = await UserPerspective.findAll({
            where: { 
                userId,
                isActive: true
            },
            include: [{
                model: Perspective,
                attributes: ['perspectiveId', 'perspectiveName', 'type']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Transform the data to match the expected format
        const formattedPerspectives = perspectives.map(p => ({
            name: p.Perspective.perspectiveName,
            value: p.value,
            source: p.source,
            verificationStatus: p.verificationStatus,
            lastVerifiedAt: p.lastVerifiedAt,
            confidence: p.confidence,
            integrationSource: p.integrationSource
        }));

        res.json(formattedPerspectives);
    } catch (error) {
        console.error('Error fetching perspectives:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { perspectiveId, verificationMethod, verificationData } = req.body;

        const perspective = await UserPerspective.findOne({
            where: { userId, perspectiveId }
        });

        if (!perspective) {
            return res.status(404).json({ error: 'Perspective not found' });
        }

        // Update verification status and details
        await perspective.update({
            verificationStatus: 'pending',
            verificationMethod,
            verificationDetails: {
                ...perspective.verificationDetails,
                [verificationMethod]: {
                    status: 'pending',
                    data: verificationData,
                    timestamp: new Date()
                }
            }
        });

        // Here you would typically trigger an async verification process
        // For now, we'll just return the updated perspective
        res.json({
            success: true,
            perspective: {
                name: perspective.Perspective.perspectiveName,
                value: perspective.value,
                verificationStatus: perspective.verificationStatus,
                verificationMethod: perspective.verificationMethod
            }
        });
    } catch (error) {
        console.error('Error initiating verification:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/integration/connect', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { integrationSource, integrationData } = req.body;

        // Here you would typically:
        // 1. Validate the integration data
        // 2. Connect to the integration service
        // 3. Store the integration credentials securely
        // 4. Update relevant perspectives with the integration source

        // For now, we'll just update perspectives that match the integration source
        await UserPerspective.update({
            integrationSource,
            verificationStatus: 'verified',
            lastVerifiedAt: new Date(),
            metadata: {
                ...sequelize.literal(`COALESCE("metadata", '{}') || '${JSON.stringify({
                    integrationConnected: true,
                    integrationTimestamp: new Date()
                })}'::jsonb`)
            }
        }, {
            where: {
                userId,
                integrationSource
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error connecting integration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/integration/sync', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { integrationSource } = req.body;

        // Here you would typically:
        // 1. Fetch latest data from the integration
        // 2. Update or create perspectives based on the data
        // 3. Update verification status and timestamps

        res.json({ success: true, message: 'Sync initiated' });
    } catch (error) {
        console.error('Error syncing integration:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;