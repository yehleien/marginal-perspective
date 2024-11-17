const express = require('express');
const router = express.Router();
const { GmailToken } = require('../../models');
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

async function searchEmails(gmail, query) {
    try {
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 10
        });

        if (!response.data.messages) {
            return [];
        }

        const results = [];
        for (const message of response.data.messages) {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });

            const subject = email.data.payload.headers.find(header => header.name === 'Subject');
            const date = email.data.payload.headers.find(header => header.name === 'Date');

            results.push({
                perspectiveName: subject.value,
                date: date.value
            });
        }

        return results;
    } catch (error) {
        console.error('Error searching emails:', error);
        throw error;
    }
}

router.post('/token', async (req, res) => {
    try {
        const { code } = req.body;
        if (!req.session.userId) {
            throw new Error('Not authenticated');
        }

        const { tokens } = await oauth2Client.getToken(code);
        const oneHourFromNow = new Date(Date.now() + (3600 * 1000));

        const savedToken = await GmailToken.create({
            userId: req.session.userId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: oneHourFromNow
        });

        console.log('Token saved successfully:', {
            tokenId: savedToken.id,
            expiresAt: oneHourFromNow
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ connected: false });
        }

        const token = await GmailToken.findOne({
            where: { userId: req.session.userId },
            order: [['createdAt', 'DESC']]
        });

        const now = new Date();
        const isValid = token && token.expiresAt > now;

        res.json({ connected: isValid });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            throw new Error('No code received');
        }

        const { tokens } = await oauth2Client.getToken(code);
        const oneHourFromNow = new Date(Date.now() + (3600 * 1000));

        await GmailToken.create({
            userId: req.session.userId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: oneHourFromNow
        });

        res.json({
            success: true,
            message: 'Gmail connected successfully'
        });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Add this route to handle auth params request
router.get('/auth-params', (req, res) => {
    try {
        res.json({
            clientId: process.env.GMAIL_CLIENT_ID,
            redirectUri: process.env.GMAIL_REDIRECT_URI,
            scope: 'https://www.googleapis.com/auth/gmail.readonly'
        });
    } catch (error) {
        console.error('Error getting auth params:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/scan', async (req, res) => {
    try {
        const { scanType } = req.body;
        const token = await GmailToken.findOne({
            where: { userId: req.session.userId },
            order: [['createdAt', 'DESC']]
        });

        if (!token) {
            return res.status(401).json({ error: 'Gmail not connected' });
        }

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        oauth2Client.setCredentials({
            access_token: token.accessToken,
            refresh_token: token.refreshToken
        });

        let query;
        switch (scanType) {
            case 'ticketmaster':
                query = 'from:noreply@ticketmaster.com';
                break;
            case 'netflix':
                query = 'from:info@netflix.com';
                break;
            case 'amazon':
                query = 'from:auto-confirm@amazon.com';
                break;
            case 'spotify':
                query = 'from:no-reply@spotify.com';
                break;
            case 'airlines':
                query = 'subject:"flight confirmation" OR subject:"e-ticket" OR subject:"itinerary"';
                break;
            case 'hotels':
                query = 'subject:"hotel confirmation" OR subject:"booking confirmation"';
                break;
            default:
                return res.status(400).json({ error: 'Invalid scan type' });
        }

        const results = await searchEmails(gmail, query);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 