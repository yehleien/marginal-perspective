const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const { User } = require('../../models');
const { generateLinkedInPerspectives } = require('./linkedinPerspectives');

const LinkedInStrategy = new OAuth2Strategy({
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_REDIRECT_URI,
    scope: ['openid', 'profile', 'email', 'r_liteprofile', 'r_basicprofile'],
    state: true
}, async (accessToken, refreshToken, params, profile, done) => {
    try {
        // Get basic profile info
        const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!userResponse.ok) {
            throw new Error(`LinkedIn API error: ${userResponse.status}`);
        }

        // Get professional profile info
        const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        if (!profileResponse.ok) {
            throw new Error(`LinkedIn Profile API error: ${profileResponse.status}`);
        }

        const userData = await userResponse.json();
        const profileData = await profileResponse.json();
        
        console.log('LinkedIn user data:', userData);
        console.log('LinkedIn profile data:', profileData);

        const [user, created] = await User.findOrCreate({
            where: { email: userData.email },
            defaults: {
                username: `${userData.given_name} ${userData.family_name}`,
                email: userData.email,
                password: 'linkedin-auth'
            }
        });

        await generateLinkedInPerspectives(user.id, accessToken, profileData);
        return done(null, user);
    } catch (error) {
        console.error('LinkedIn Auth Error:', error);
        return done(error, null);
    }
});

passport.use('linkedin', LinkedInStrategy);

module.exports = passport; 