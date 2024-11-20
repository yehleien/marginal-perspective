const express = require('express');
const router = express.Router();
const passport = require('../../api-connections/linkedin/linkedinStrategy');
const { Perspective } = require('../../models');

router.get('/', passport.authenticate('linkedin', { state: true }));

router.get('/callback', 
    passport.authenticate('linkedin', {
        successRedirect: '/account',
        failureRedirect: '/login'
    })
);

router.get('/verify', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const perspective = await Perspective.findOne({
            where: {
                userId: req.user.id,
                type: 'linkedin'
            }
        });

        res.json({
            verified: !!perspective,
            perspective: perspective
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;