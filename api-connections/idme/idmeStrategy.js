const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const { User } = require('../../models');
const { createIdmePerspectives } = require('./idmePerspectives');

const IdMeStrategy = new OAuth2Strategy({
    authorizationURL: 'https://api.id.me/oauth/authorize',
    tokenURL: 'https://api.id.me/oauth/token',
    clientID: process.env.IDME_CLIENT_ID,
    clientSecret: process.env.IDME_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/idme/callback'
        : 'https://marginalperspective.com/idme/callback',
    scope: 'identity'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const userResponse = await fetch('https://api.id.me/api/public/v3/attributes.json', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!userResponse.ok) {
            throw new Error(`ID.me API error: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        
        const [user, created] = await User.findOrCreate({
            where: { email: userData.email },
            defaults: {
                username: userData.name,
                email: userData.email,
                password: 'idme-auth'
            }
        });

        await createIdmePerspectives(user.id, userData);
        return done(null, user);
    } catch (error) {
        console.error('ID.me Auth Error:', error);
        return done(error, null);
    }
});

passport.use('idme', IdMeStrategy);
module.exports = passport; 