const express = require('express');
const db = require('./config/db.js')
const app = express();
const path = require('path');
const session = require('express-session');
const csrf = require('csurf');
const PORT = 3000;

// const userRouter = require('./routes/userRoutes.js')

// middleware for url parameters
app.use(express.urlencoded({extended:false}));
// middleware for json
app.use(express.json());
// everything in public folder can be accessed as if they were at root
app.use(express.static(path.join(__dirname, 'public')));
// middleware for server-side session storage
app.use(
    session({
        secret: process.env.SESSION_SECRET_KEY, 
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            secure: false, // must set to true for https
            sameSite: 'Strict', // Prevent CSRF via third-party sites
            maxAge: 24 * 60 * 60 * 1000,
        },
        userId: undefined,
        loggedIn: false
    })
);
// middleware for csrf tokens and authentication
// as middleware, its automatically applied to all http requests
// auto-generates per session, accessed via req.csrfToken()
const csrfProtection = csrf({ cookie: false });
app.use(csrfProtection); 
module.exports = csrfProtection // must export it before routers need it!!

// these will be applied to all routes below!!!
const userRouter = require('./routes/userRoutes.js')
const postRouter = require('./routes/postRoutes.js')

// app.use('/user', csrfProtection, userRouter);
app.use('/user', userRouter);
app.use('/post', postRouter);

// server URLs
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

// route to send the CSRF token to the client 
app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() }); // Send the CSRF token to the client
});

// place at BOTTOM of server.js. 404 bc didnt match any other endpoint
app.all('*', (req,res) => { 
    res.status(404);
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if(req.accepts('json')){
        res.json({error: "404 page not found"});
    } else {
        res.type('txt').send("404 page not found");
    }
});

// start the server
app.listen(PORT, () => {

})