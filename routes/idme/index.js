const express = require('express');
const router = express.Router();
const axios = require('axios');
const { User, IdmeToken, IdmeProfile } = require('../../models');
const { createIdmePerspectives } = require('../../api-connections/idme/idmePerspectives');

const CLIENT_ID = process.env.IDME_CLIENT_ID;
const CLIENT_SECRET = process.env.IDME_CLIENT_SECRET;
const REDIRECT_URI = 'https://marginalperspective.com/idme/callback';

const state = 'someRandomState'; // You can generate a random state for security

router.get('/button', (req, res) => {
    res.render('idme/button', {
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI
    });
});

router.get('/auth-params', (req, res) => {
    const params = {
        clientId: process.env.IDME_CLIENT_ID || '9b1da5b436e632efe996a25950e36baa',
        redirectUri: 'https://marginalperspective.com/idme/callback',
        scope: 'student',
        state: state
    };
    console.log('Auth params being sent:', params);
    res.json(params);
});

router.get('/callback', async (req, res) => {
    console.log('Full callback request:', {
        query: req.query,
        headers: req.headers,
        session: req.session
    });
    
    try {
        const { code, error, error_description } = req.query;
        
        if (error) {
            console.error('OAuth error:', error, error_description);
            return res.status(400).json({ error, error_description });
        }

        if (!code) {
            throw new Error('No authorization code received');
        }

        console.log('Exchanging code for token...');
        const tokenResponse = await axios.post('https://api.id.me/oauth/token', null, {
            params: {
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }
        });

        console.log('Token received. Getting user profile...');
        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        const profileResponse = await axios.get('https://api.id.me/api/public/v3/attributes.json', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const userData = profileResponse.data;
        console.log('Profile received:', userData);

        // Save or update the user
        const [user, created] = await User.findOrCreate({
            where: { email: userData.email },
            defaults: {
                username: userData.name,
                email: userData.email,
                password: 'idme-auth'
            }
        });

        // Save the token
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        await IdmeToken.upsert({
            userId: user.id,
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt
        });

        // Save or update the ID.me profile
        await IdmeProfile.upsert({
            userId: user.id,
            verified: true,
            attributes: userData.attributes || {},
            status: userData.status || [],
            education: userData.education || {}
        });

        // Create perspectives based on the ID.me data
        await createIdmePerspectives(user.id, userData);

        req.session.idmeProfile = userData;
        res.redirect('/account');

    } catch (error) {
        console.error('ID.me callback error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// Add logging to verify environment variables
console.log('Client ID:', CLIENT_ID);
console.log('Redirect URI:', REDIRECT_URI);

module.exports = router; 