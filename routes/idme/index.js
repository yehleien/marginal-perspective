const express = require('express');
const router = express.Router();
const axios = require('axios');

const CLIENT_ID = process.env.IDME_CLIENT_ID;
const CLIENT_SECRET = process.env.IDME_CLIENT_SECRET;
const REDIRECT_URI = 'https://marginalperspective.com/idme/callback';

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
        scope: 'identity'
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
        const { access_token } = tokenResponse.data;

        const profileResponse = await axios.get('https://api.id.me/api/public/v3/attributes.json', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        console.log('Profile received:', profileResponse.data);
        req.session.idmeProfile = profileResponse.data;
        
        res.redirect('/account');

    } catch (error) {
        console.error('ID.me callback error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 