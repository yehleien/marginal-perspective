const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const { User } = require('../../models');
const { generateLinkedInPerspectives } = require('./linkedinPerspectives');

const LinkedInStrategy = new OAuth2Strategy({
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: '86r29l0bjv9g7i',
    clientSecret: 'WPL_AP1.vLw4NduG57NloVqg.h3v81Q==',
    callbackURL: 'http://localhost:3000/auth/linkedin/callback',
    scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    state: true
}, async (accessToken, refreshToken, params, profile, done) => {
    try {
        // Get basic profile info
        const userResponse = await fetch('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!userResponse.ok) {
            throw new Error(`LinkedIn API error: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        
        // Get email address
        const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!emailResponse.ok) {
            throw new Error(`LinkedIn Email API error: ${emailResponse.status}`);
        }

        const emailData = await emailResponse.json();
        const email = emailData.elements[0]['handle~'].emailAddress;

        const [user, created] = await User.findOrCreate({
            where: { email: email },
            defaults: {
                username: `${userData.localizedFirstName} ${userData.localizedLastName}`,
                email: email,
                password: 'linkedin-auth'
            }
        });

        await generateLinkedInPerspectives(user.id, accessToken);
        return done(null, user);
    } catch (error) {
        console.error('LinkedIn Auth Error:', error);
        return done(error, null);
    }
});

passport.use('linkedin', LinkedInStrategy);

module.exports = passport; 