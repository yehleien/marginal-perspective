const { Perspective, UserPerspective, sequelize } = require('../../models');

async function createFacebookPerspectives(userId, facebookData, instagramData) {
    try {
        const [result] = await sequelize.query(
            'SELECT MAX("perspectiveId") + 1 as next_id FROM "Perspectives"'
        );
        let nextId = result[0].next_id || 1;
        const perspectives = [];

        // Facebook Friends Count Perspective
        if (facebookData.friends?.data?.length > 0) {
            const friendsPerspective = await Perspective.create({
                perspectiveId: nextId++,
                perspectiveName: 'Facebook Network Size',
                categoryType: 'sociographic',
                verificationMethod: 'facebook',
                verificationDate: new Date(),
                activityScore: 0,
                options: [`${facebookData.friends.data.length} friends`],
                type: 'social_network'
            });
            perspectives.push(friendsPerspective);
        }

        // Location Perspective
        if (facebookData.location) {
            const locationPerspective = await Perspective.create({
                perspectiveId: nextId++,
                perspectiveName: `Lives in ${facebookData.location.name}`,
                categoryType: 'geographic',
                verificationMethod: 'facebook',
                verificationDate: new Date(),
                activityScore: 0,
                options: [facebookData.location.name],
                type: 'location'
            });
            perspectives.push(locationPerspective);
        }

        // Instagram Follower Count Perspective
        if (instagramData?.instagram_business_account?.followers_count) {
            const followersPerspective = await Perspective.create({
                perspectiveId: nextId++,
                perspectiveName: 'Instagram Influence',
                categoryType: 'sociographic',
                verificationMethod: 'instagram',
                verificationDate: new Date(),
                activityScore: 0,
                options: [`${instagramData.instagram_business_account.followers_count} followers`],
                type: 'social_influence'
            });
            perspectives.push(followersPerspective);
        }

        // Interests/Likes Perspectives
        if (facebookData.likes?.data?.length > 0) {
            const categories = {};
            facebookData.likes.data.forEach(like => {
                if (!categories[like.category]) {
                    categories[like.category] = [];
                }
                categories[like.category].push(like.name);
            });

            for (const [category, items] of Object.entries(categories)) {
                const likesPerspective = await Perspective.create({
                    perspectiveId: nextId++,
                    perspectiveName: `Interested in ${category}`,
                    categoryType: 'psychographic',
                    verificationMethod: 'facebook',
                    verificationDate: new Date(),
                    activityScore: 0,
                    options: items,
                    type: 'interests'
                });
                perspectives.push(likesPerspective);
            }
        }

        // Create UserPerspective entries
        await Promise.all(perspectives.map(perspective => 
            UserPerspective.create({
                userId,
                perspectiveId: perspective.perspectiveId,
                source: 'facebook',
                verificationStatus: 'verified',
                verificationMethod: perspective.verificationMethod,
                lastVerifiedAt: new Date(),
                confidence: 1.0
            })
        ));

        return perspectives;
    } catch (error) {
        console.error('Error creating Facebook perspectives:', error);
        throw error;
    }
}

module.exports = { createFacebookPerspectives }; 