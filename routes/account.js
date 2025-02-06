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
        console.log('Adding email for userId:', userId);
        
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { email } = req.body;
        console.log('Attempting to add email:', email);
        
        // Check if email already exists
        const existing = await UserEmail.findOne({ where: { email } });
        console.log('Existing email check:', existing);
        
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new email entry
        console.log('Creating new UserEmail with:', { userId, email });
        const userEmail = await UserEmail.create({
            userId,
            email,
            isPrimary: false,
            isVerified: false
        }).catch(err => {
            console.error('Detailed create error:', err);
            throw err;
        });

        console.log('Created userEmail:', userEmail);
        res.json({ success: true, email: userEmail });
    } catch (error) {
        console.error('Detailed error in add-email:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
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

        // Clean and validate the data before updating
        const updates = {
            phoneNumber: req.body.phoneNumber || null,
            birthDate: req.body.birthDate ? new Date(req.body.birthDate) : null,
            gender: req.body.gender || null,
            politicalAffiliation: req.body.politicalAffiliation || null,
            maritalStatus: req.body.maritalStatus || null,
            numberOfChildren: req.body.numberOfChildren || 0,
            education: {
                highSchool: {
                    graduated: Boolean(req.body.education?.highSchool?.graduated),
                    schoolName: req.body.education?.highSchool?.schoolName || null,
                    graduationYear: req.body.education?.highSchool?.graduationYear || null
                },
                undergraduate: {
                    graduated: Boolean(req.body.education?.undergraduate?.graduated),
                    schoolName: req.body.education?.undergraduate?.schoolName || null,
                    graduationYear: req.body.education?.undergraduate?.graduationYear || null,
                    degree: req.body.education?.undergraduate?.degree || null,
                    major: req.body.education?.undergraduate?.major || null
                },
                graduate: {
                    graduated: Boolean(req.body.education?.graduate?.graduated),
                    schoolName: req.body.education?.graduate?.schoolName || null,
                    graduationYear: req.body.education?.graduate?.graduationYear || null,
                    degree: req.body.education?.graduate?.degree || null,
                    field: req.body.education?.graduate?.field || null
                }
            },
            address: {
                city: req.body.address?.city || null,
                state: req.body.address?.state || null,
                zipCode: req.body.address?.zipCode || null,
                country: req.body.address?.country || 'United States'
            },
            employmentHistory: Array.isArray(req.body.employmentHistory) ? req.body.employmentHistory.map(job => ({
                companyName: job.companyName || null,
                jobTitle: job.jobTitle || null,
                startDate: job.startDate ? new Date(job.startDate) : null,
                endDate: job.endDate ? new Date(job.endDate) : null,
                salary: job.salary || null
            })) : [],
            investments: Array.isArray(req.body.investments) ? req.body.investments.map(inv => ({
                type: inv.type || null,
                symbol: inv.symbol || null,
                quantity: inv.quantity || null,
                purchasePrice: inv.purchasePrice || null
            })) : [],
            mortgages: Array.isArray(req.body.mortgages) ? req.body.mortgages.map(mort => ({
                propertyAddress: mort.propertyAddress || null,
                loanAmount: mort.loanAmount || null,
                interestRate: mort.interestRate || null,
                startDate: mort.startDate ? new Date(mort.startDate) : null,
                loanTerm: mort.loanTerm || null
            })) : [],
            vehicles: Array.isArray(req.body.vehicles) ? req.body.vehicles.map(vehicle => ({
                make: vehicle.make || null,
                model: vehicle.model || null,
                year: vehicle.year || null,
                vin: vehicle.vin || null
            })) : [],
            religion: req.body.religion || null,
            votingHistory: Array.isArray(req.body.votingHistory) ? req.body.votingHistory.map(vote => ({
                election: vote.election || null,
                date: vote.date ? new Date(vote.date) : null,
                method: vote.method || null,
                jurisdiction: vote.jurisdiction || null
            })) : []
        };

        await user.update(updates);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Add this new route to handle email deletion
router.delete('/emails/:email', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const emailToDelete = decodeURIComponent(req.params.email);
        
        // Don't allow deletion of primary email
        const email = await UserEmail.findOne({
            where: { 
                userId,
                email: emailToDelete
            }
        });

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        if (email.isPrimary) {
            return res.status(400).json({ error: 'Cannot delete primary email' });
        }

        await UserEmail.destroy({
            where: {
                userId,
                email: emailToDelete
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add email verification route
router.post('/verify-email', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { email, code } = req.body;
        
        // Find the email record
        const userEmail = await UserEmail.findOne({
            where: { 
                userId,
                email
            }
        });

        if (!userEmail) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // TODO: Add your actual verification code check here
        // For now, we'll verify with any code
        await userEmail.update({ verified: true });

        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;