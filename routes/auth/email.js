const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { UserEmail } = require('../../models');

console.log('Email route file loaded');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Test the transporter on server start
transporter.verify(function (error, success) {
    if (error) {
        console.log('Nodemailer setup error:', error);
    } else {
        console.log('Nodemailer is ready to send messages');
    }
});

// Code expiration time (15 minutes)
const CODE_EXPIRATION = 15 * 60 * 1000;

router.post('/send-verification', async (req, res) => {
    console.log('Received verification request:', req.body);
    try {
        const { email } = req.body;
        console.log('Attempting to send verification to:', email);
        
        const userEmail = await UserEmail.findOne({ where: { email } });
        console.log('Found userEmail:', userEmail);
        
        if (!userEmail) {
            console.log('Email not found in database');
            return res.status(404).json({ error: 'Email not found' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + CODE_EXPIRATION);
        
        console.log('Generated code:', verificationCode);
        
        await userEmail.update({
            verificationCode,
            verificationExpires
        });
        console.log('Updated user email record');

        await transporter.sendMail({
            from: `"Marginal Perspective" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your email',
            html: `
                <h1>Email Verification</h1>
                <p>Your verification code is: <strong>${verificationCode}</strong></p>
                <p>This code will expire in 15 minutes.</p>
            `
        });
        
        console.log('Email sent successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Detailed error in send-verification:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log('Verifying:', { email, code });
        
        const userEmail = await UserEmail.findOne({ where: { email } });
        console.log('Found email record:', userEmail);

        if (!userEmail) {
            return res.status(404).json({ error: 'Email not found' });
        }

        console.log('Comparing:', {
            stored: userEmail.verificationCode,
            received: code,
            expires: userEmail.verificationExpires
        });

        if (!userEmail.verificationCode || 
            userEmail.verificationCode !== code ||
            new Date(userEmail.verificationExpires) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        await userEmail.update({
            isVerified: true,
            verificationCode: null,
            verificationExpires: null
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
});

module.exports = router; 