const express = require('express');
const router = express.Router();
const { User, UserEmail } = require('../models');

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findByPk(userId, {
            attributes: [
                'email', 
                'phoneNumber', 
                'birthDate', 
                'gender', 
                'address', 
                'secondaryEmail', 
                'politicalAffiliation',
                'maritalStatus',
                'numberOfChildren',
                'education'
            ]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.post('/update-profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { phoneNumber, birthDate, gender, address } = req.body;
        const user = await User.findByPk(userId);

        // Only update fields that are empty in the database
        const updates = {};
        if (!user.phoneNumber && phoneNumber) updates.phoneNumber = phoneNumber;
        if (!user.birthDate && birthDate) updates.birthDate = birthDate;
        if (!user.gender && gender) updates.gender = gender;
        if (!user.address && address) updates.address = address;

        if (Object.keys(updates).length > 0) {
            await User.update(updates, {
                where: { id: userId }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add email routes
router.post('/add-email', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { email } = req.body;
        
        // Check if email already exists
        const existing = await UserEmail.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new email entry
        const userEmail = await UserEmail.create({
            userId,
            email,
            isPrimary: false,
            isVerified: false
        });

        res.json({ success: true, email: userEmail });
    } catch (error) {
        console.error('Error adding email:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/emails', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const emails = await UserEmail.findAll({
            where: { userId },
            order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
        });

        res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Make sure this route exists and works
router.get('/current', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        console.log('Updating profile with:', req.body);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({
            phoneNumber: req.body.phoneNumber,
            birthDate: req.body.birthDate,
            gender: req.body.gender,
            politicalAffiliation: req.body.politicalAffiliation,
            maritalStatus: req.body.maritalStatus,
            numberOfChildren: req.body.numberOfChildren,
            education: req.body.education,
            address: req.body.address
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;