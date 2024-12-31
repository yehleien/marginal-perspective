require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const cookieParser = require('cookie-parser');
const { sequelize, User } = require('./models');
const bcrypt = require('bcrypt');
const axios = require('axios'); // Added axios for web scraping
const cheerio = require('cheerio'); // Added cheerio for web scraping
const cors = require('cors');
require('dotenv').config();
require('dotenv').config({ path: './spotify.env' });
require('dotenv').config({ path: './gmail.env' });
console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
console.log('Gmail environment variables loaded:', {
    clientId: process.env.GMAIL_CLIENT_ID,
    redirectUri: process.env.GMAIL_REDIRECT_URI
});

// Model definitions
const { Article, Comment, Perspective, Vote, UserPerspective } = require('./models/index');

// Debugging
console.log("Models defined: User, Article, Comment, Perspective, UserPerspective");

// Route modules using dependency injection
const commentRoutes = require('./routes/comments');
const articleRoutes = require('./routes/articles');
const perspectiveRoutes = require('./routes/perspectives');
const UserPerspectiveRoutes = require('./routes/UserPerspective');
const spotifyRoutes = require('./api-connections/spotify/spotifyRoutes');
const gmailRoutes = require('./api-connections/gmail/gmailRoutes');
const communitiesRouter = require('./routes/communities');
const idmeRoutes = require('./routes/idme');
const accountRoutes = require('./routes/account');

console.log("Routes defined: commentRoutes, articleRoutes, perspectiveRoutes, UserPerspective Routes, spotifyRoutes, gmailRoutes, communitiesRouter, idmeRoutes, accountRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use(session({
    secret: '69', // replace with your own secret key
    store: new SequelizeStore({
        db: sequelize
    }),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // set to true if you're using https, 1 week max age
}));

console.log("Express app setup complete");

app.use('/comments', commentRoutes);
app.use('/articles', articleRoutes);
app.use('/perspectives', perspectiveRoutes);
app.use('/UserPerspective', UserPerspectiveRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/auth/spotify', spotifyRoutes);
app.use('/gmail', gmailRoutes);
app.use('/communities', communitiesRouter);
app.use('/idme', idmeRoutes);
app.use('/account', accountRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/account/login', (req, res) => {
    const { username, password } = req.body;

    User.findOne({ where: { username } })
        .then(user => {
            if (!user) {
                res.json({ success: false, error: 'User not found' });
            } else {
                // Check if the entered password matches the stored password
                bcrypt.compare(password, user.password, function(err, result) {
                    if (result == true) {
                        req.session.userId = user.id;
                        res.json({ success: true });
                    } else {
                        res.json({ success: false, error: 'Incorrect password' });
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

app.post('/account/signup', (req, res) => {
    const { username, email, password } = req.body;

    // Hash the password before saving it to the database
    bcrypt.hash(password, 10, function(err, hashedPassword) {
        if (err) {
            console.error('Error during password hashing:', err);
            res.json({ success: false, error: 'Server error' });
        } else {
            User.create({ username, email, password: hashedPassword })
                .then(user => {
                    req.session.userId = user.id;

                    // After creating the user, create the default perspectives
                    const defaultPerspectives = [
                        { userId: user.id, perspectiveName: 'Gender Identity', type: 'default', options: ['Male', 'Female', 'Non-Binary', 'Other'] },
                        { userId: user.id, perspectiveName: 'Date of Birth', type: 'default', options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'] },
                        { userId: user.id, perspectiveName: 'Marital Status', type: 'default', options: ['Single', 'Married', 'Divorced', 'Widowed']}
                        // Add more default perspectives as needed
                    ];
                    Perspective.bulkCreate(defaultPerspectives)
                        .then(() => {
                            res.json({ success: true });
                        })
                        .catch(error => {
                            console.error('Error during perspective creation:', error);
                            res.json({ success: false, error: 'Server error' });
                        });
                })
                .catch(error => {
                    console.error('Error during signup:', error);
                    res.json({ success: false, error: 'Server error' });
                });
        }
    });
});

// Remove all other logout routes and keep just this one
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server error');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.get('/account/current', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, error: 'Not logged in' });
    }

    User.findOne({ where: { id: req.session.userId } })
        .then(user => {
            if (user) {
                res.json({ 
                    success: true, 
                    username: user.username, 
                    email: user.email, 
                    id: user.id 
                });
            } else {
                res.json({ success: false, error: 'User not found' });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
        return sequelize.sync();
    })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Serve static files from the perspective-platform directory
app.use(express.static('perspective-platform'));

// Redirect from root to /home
app.get('/', (_req, res) => {
    res.redirect('/home');
});

// Define routes for each HTML page
app.get('/index', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'index', 'index.html')));
app.get('/account', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'account', 'account.html')));
app.get('/submit', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'submit', 'submit.html')));
app.get('/home', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'home', 'home.html')));
app.get('/insights', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'insights', 'insights.html')));
app.get('/communities', (_req, res) => {
    res.sendFile(path.join(__dirname, 'perspective-platform', 'communities', 'communities.html'));
});
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));

// Add body parser middleware
app.use(bodyParser.json());

// Add session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Auth routes
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }

    try {
        const user = await User.findOne({ 
            where: { username: username }
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
            req.session.userId = user.id;
            return res.json({ 
                success: true,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

app.post('/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

const articlesRouter = require('./routes/articles');
const commentsRouter = require('./routes/comments');

app.use('/articles', articlesRouter);
app.use('/', commentsRouter);

// Add these imports at the top
const { google } = require('googleapis');
const { GmailToken } = require('./models');

// Add this after your other middleware
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

// Make oauth2Client available to routes
app.locals.oauth2Client = oauth2Client;

// Add this route to check session status
app.get('/auth/check-session', (req, res) => {
    res.json({
        isLoggedIn: !!req.session.userId
    });
});

// Add this route to handle logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/index.html');
});

// Add near the top with other requires
// const passport = require('./api-connections/linkedin/linkedinStrategy');

// Add these BEFORE your routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using https
}));

// app.use(passport.initialize());
// app.use(passport.session());

// Add the LinkedIn routes
// app.use('/auth/linkedin', require('./routes/auth/linkedin'));

// Update your auth routes import
app.use('/auth', require('./routes/auth'));

// Add with other requires at top
// const linkedinRoutes = require('./routes/auth/linkedin');

// Add with other app.use statements
// app.use('/auth/linkedin', linkedinRoutes);

// Add this near your other static routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'perspective-platform', 'index', 'index.html'));
});
// Add these Passport serialize/deserialize functions
// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await User.findByPk(id);
//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// });

const perspectivesRouter = require('./routes/perspectives');

app.use('/perspectives', perspectivesRouter);

const userPerspectiveRouter = require('./routes/UserPerspective');

app.use('/UserPerspective', userPerspectiveRouter);

const passport = require('passport');
const linkedinRoutes = require('./routes/auth/linkedin');

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Add the LinkedIn routes
app.use('/auth/linkedin', linkedinRoutes);

const userPerspectiveRoutes = require('./routes/userPerspective');
app.use('/UserPerspective', userPerspectiveRoutes);

