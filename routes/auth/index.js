const express = require('express');
const router = express.Router();

// Comment out all LinkedIn routes
/*
router.get('/', passport.authenticate('linkedin', { state: true }));
router.get('/callback', passport.authenticate('linkedin', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));
*/

module.exports = router;