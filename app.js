const commentsRouter = require('./routes/comments');
app.use('/comments', commentsRouter);

const idmeRoutes = require('./routes/idme');
app.use('/idme', idmeRoutes);

const accountRouter = require('./routes/account');
app.use('/account', accountRouter); 