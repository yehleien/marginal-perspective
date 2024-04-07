const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const cookieParser = require('cookie-parser');
const { sequelize, Sequelize, db } = require('./models/index');
const DataTypes = Sequelize.DataTypes;
const bcrypt = require('bcrypt');
const axios = require('axios'); // Added axios for web scraping
const cheerio = require('cheerio'); // Added cheerio for web scraping

// Model definitions
const { User, Article, Comment, Perspective, Vote, UserPerspective } = require('./models/index');

// Debugging
console.log("Models defined: User, Article, Comment, Perspective, UserPerspective");

// Route modules using dependency injection
const commentRoutes = require('./routes/comments');
const articleRoutes = require('./routes/articles');
const perspectiveRoutes = require('./routes/perspectives');
const UserPerspectiveRoutes=require('./routes/UserPerspective');

console.log("Routes defined: commentRoutes, articleRoutes, perspectiveRoutes, UserPerspective Routes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

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

// Add a logout route to clear the session and redirect to the login page
app.post('/account/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Server error');
        } else {
            res.redirect('/login'); // Redirect to the login page after logout
        }
    });
});

app.get('/account/current', (req, res) => {
    const userId = req.session.userId;
    User.findOne({ where: { id: userId } })
        .then(user => {
            res.json({ username: user.username, email: user.email, id: user.id });
        })
        .catch(error => {
            console.error('Error:', error);
            res.json({ success: false, error: 'Server error' });
        });
});

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        return sequelize.sync();
    })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Serve static files from the perspective-platform directory
app.use(express.static('perspective-platform'));

// Redirect from root to /communities
app.get('/', (_req, res) => {
    res.redirect('/communities');
});

// Define routes for each HTML page
//app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'communities', 'communities.html')));
app.get('/account', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'account', 'account.html')));
app.get('/submit', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'submit', 'submit.html')));
app.get('/communities', (_req, res) => res.sendFile(path.join(__dirname, 'perspective-platform', 'communities', 'communities.html')));
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));
