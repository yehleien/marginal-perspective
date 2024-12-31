const { Perspective, UserPerspective, sequelize } = require('../../models');

async function generateLinkedInPerspectives(userId, accessToken) {
    try {
        const response = await fetch('https://api.linkedin.com/rest/memberSnapshotData', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202312',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        const perspectives = [];

        // Process each domain's data
        for (const element of data.elements) {
            if (element.snapshotDomain === 'PROFILE') {
                // Create perspective from profile data
                const profile = element.snapshotData[0];
                if (profile.Headline) {
                    const perspective = await Perspective.create({
                        perspectiveName: profile.Headline,
                        type: 'professional_experience',
                        categoryType: 'professional',
                        verificationMethod: 'professional_network',
                        verificationStatus: 'verified',
                        verificationDate: new Date(),
                        metadata: {
                            industry: profile.Industry,
                            location: profile['Geo Location'],
                            source: 'linkedin'
                        }
                    });

                    await UserPerspective.create({
                        userId,
                        perspectiveId: perspective.perspectiveId
                    });

                    perspectives.push(perspective);
                }
            }
        }

        return perspectives;
    } catch (error) {
        console.error('Error generating LinkedIn perspectives:', error);
        throw error;
    }
}

module.exports = { generateLinkedInPerspectives }; 