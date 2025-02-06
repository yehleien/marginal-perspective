const express = require('express');
const router = express.Router();
const axios = require('axios');
const { User, FacebookToken, FacebookProfile } = require('../../models');
const { createFacebookPerspectives } = require('../../api-connections/facebook/facebookPerspectives');

const CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const REDIRECT_URI = 'https://marginalperspective.com/facebook/callback';

router.get('/auth', (req, res) => {
    const scopes = [
        'email',
        'public_profile',
        'user_friends',
        'user_hometown',
        'user_likes',
        'user_location',
        'user_photos',
        'user_posts',
        'instagram_graph_user_profile',
        'instagram_graph_user_media'
    ];

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(','))}`;
    res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code
            }
        });

        const { access_token, expires_in } = tokenResponse.data;

        // Get Facebook user data
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email,friends,location,likes'
            }
        });

        const userData = userResponse.data;

        // Get Instagram data if available
        let instagramData = {};
        try {
            const igResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
                params: {
                    access_token,
                    fields: 'instagram_business_account{id,username,profile_picture_url,followers_count,follows_count}'
                }
            });
            instagramData = igResponse.data;
        } catch (error) {
            console.error('Error fetching Instagram data:', error);
        }

        // Save or update user
        const [user, created] = await User.findOrCreate({
            where: { email: userData.email },
            defaults: {
                username: userData.name,
                email: userData.email
            }
        });

        // Save token
        const expiresAt = new Date(Date.now() + expires_in * 1000);
        await FacebookToken.upsert({
            userId: user.id,
            accessToken: access_token,
            expiresAt,
            scope: req.query.scope?.split(',') || []
        });

        // Save profile data
        await FacebookProfile.upsert({
            userId: user.id,
            facebookId: userData.id,
            instagramId: instagramData?.instagram_business_account?.id,
            name: userData.name,
            email: userData.email,
            friends: userData.friends?.data || [],
            location: userData.location || {},
            likes: userData.likes?.data || [],
            instagramFollowers: instagramData?.instagram_business_account?.followers_count || 0,
            instagramFollowing: instagramData?.instagram_business_account?.follows_count || 0,
            metadata: {
                facebook: userData,
                instagram: instagramData
            }
        });

        // Create perspectives
        await createFacebookPerspectives(user.id, userData, instagramData);

        res.redirect('/account');
    } catch (error) {
        console.error('Facebook auth error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/token', async (req, res) => {
    try {
        const { accessToken, userID, expiresIn } = req.body;

        // Get Facebook user data
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: accessToken,
                fields: 'id,name,email,friends,location,likes'
            }
        });

        const userData = userResponse.data;

        // Get Instagram data if available
        let instagramData = {};
        try {
            const igResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
                params: {
                    access_token: accessToken,
                    fields: 'instagram_business_account{id,username,profile_picture_url,followers_count,follows_count}'
                }
            });
            instagramData = igResponse.data;
        } catch (error) {
            console.error('Error fetching Instagram data:', error);
        }

        // Save or update user
        const [user, created] = await User.findOrCreate({
            where: { email: userData.email },
            defaults: {
                username: userData.name,
                email: userData.email
            }
        });

        // Save token
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        await FacebookToken.upsert({
            userId: user.id,
            accessToken,
            expiresAt,
            scope: req.body.scope?.split(',') || []
        });

        // Save profile data
        await FacebookProfile.upsert({
            userId: user.id,
            facebookId: userData.id,
            instagramId: instagramData?.instagram_business_account?.id,
            name: userData.name,
            email: userData.email,
            friends: userData.friends?.data || [],
            location: userData.location || {},
            likes: userData.likes?.data || [],
            instagramFollowers: instagramData?.instagram_business_account?.followers_count || 0,
            instagramFollowing: instagramData?.instagram_business_account?.follows_count || 0,
            metadata: {
                facebook: userData,
                instagram: instagramData
            }
        });

        // Create perspectives
        await createFacebookPerspectives(user.id, userData, instagramData);

        res.json({ success: true });
    } catch (error) {
        console.error('Error handling Facebook token:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 