const { Perspective, UserPerspective, sequelize } = require('../../models');

async function generateLinkedInPerspectives(userId, accessToken) {
    try {
        const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const userData = await userResponse.json();

        // Get the next available ID
        const [result] = await sequelize.query(
            'SELECT MAX("perspectiveId") + 1 as next_id FROM "Perspectives"'
        );
        const nextId = result[0].next_id || 1;

        const perspective = await Perspective.create({
            perspectiveId: nextId,
            perspectiveName: `${userData.given_name} ${userData.family_name} - Professional`,
            categoryType: 'professional',
            userId,
            verificationMethod: 'professional_network',
            verificationStatus: 'verified',
            verificationDate: new Date(),
            organization: userData.headline || 'Professional',
            activityScore: 0
        });

        await UserPerspective.create({
            userId,
            perspectiveId: perspective.perspectiveId
        });

        return perspective;
    } catch (error) {
        console.error('Error generating LinkedIn perspective:', error);
        throw error;
    }
}

module.exports = { generateLinkedInPerspectives }; 