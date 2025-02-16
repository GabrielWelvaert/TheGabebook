const express = require('express');
const db = require('./config/db.js')
const app = express();
const path = require('path');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const authenticate = require('./middleware/sessionAuthenticator.js');
const PORT = 3000;

// const userRouter = require('./routes/userRoutes.js')

// middleware for url parameters
app.use(express.urlencoded({extended:false}));
// middleware for json
app.use(express.json());
// everything in public folder can be accessed as if they were at root
app.use(express.static(path.join(__dirname, 'public')));
// middleware for server-side session storage
// used with csurf to give a csrf token for a device, shared among all tabs
app.use(
    session({ 
        secret: process.env.SESSION_SECRET_KEY, 
        resave: false,
        saveUninitialized: true,
        cookie: { // session cookie
            httpOnly: true, // true means not accessible by javascript
            secure: process.env.DB_HOST !== 'localhost', // must set to true for https
            sameSite: 'Strict', // allow same site cookies 
            maxAge: 6 * 60 * 60 * 1000,
        },
    })
);
app.use(cookieParser());
// middleware for csrf tokens and authentication
// as middleware, its automatically applied to all http requests
// auto-generates per session, accessed via req.csrfToken()
const csrfProtection = csrf({
    cookie: true,
    value: (req) => { // instruct csurf to find token in cookie which is automatically sent
        return req.cookies.csrfToken; 
    }
});
app.use(csrfProtection); 
// export so routers can use it selectively
// must export it before routers need it!!
module.exports = csrfProtection 

// Authentication Middleware
app.use((req, res, next) => {
    if(['/user/login', '/user/register', '/', '/csrf-token'].includes(req.path)){
        return next(); // Skip auth for these routes  
    }
    authenticate(req, res, next); // Apply authentication for other routes
});

// these will be applied to all routes below!!!
const userRouter = require('./routes/userRoutes.js');
const postRouter = require('./routes/postRoutes.js');
const likesRouter = require('./routes/likesRoutes.js');

app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/likes', likesRouter);

// server URLs
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

// route to set CSRF in cookie. Must occur on page load for pages with access to csrf-protected routes
// do this via an await call to the clientUtils function setCSRFCookie()
app.get('/csrf-token', (req, res) => {
    const csrfToken = req.csrfToken();  // Generate CSRF token

    res.cookie('csrfToken', csrfToken, {
        httpOnly: true,  // prevent access via JavaScript
        secure: process.env.DB_HOST !== 'localhost',  // use true for HTTPS
        sameSite: 'Strict',  // block cross-site requests
        maxAge: 3600000,  // 1 hour (you can adjust this as needed)
    });

    // must include cookie in the response
    res.json({csrfToken});
});

// place at BOTTOM of server.js. 404 bc didnt match any other endpoint
app.all('*', (req,res) => { 
    res.status(404);
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname, 'public', '404.html'));
    } else if(req.accepts('json')){
        res.json({error: "404 page not found"});
    } else {
        res.type('txt').send("404 page not found");
    }
});

// start the server
app.listen(PORT, () => {

})