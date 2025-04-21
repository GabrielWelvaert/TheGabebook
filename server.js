const express = require('express');
const db = require('./config/db.js')
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const authenticate = require('./middleware/sessionAuthenticator.js');
const validateFriendship = require('./middleware/friendValidationMiddleware');

const PORT = 3000;
const app = express();

// middleware are automatically applied to all http requests, before they execute (or selectively)
// middleware for url parameters
app.use(express.urlencoded({extended:true}));
// middleware for json
app.use(express.json());
// everything in public folder can be accessed as if they were at root
app.use(express.static(path.join(__dirname, 'public')));
// configuring express-session middleware for server-side sessions
const sessionMiddleware = session({ 
    secret: process.env.SESSION_SECRET_KEY, 
    resave: false,
    saveUninitialized: true,
    cookie: { // session cookie (connection.sid)
        httpOnly: true, // cant be accessed via javascript
        secure: process.env.DB_HOST !== 'localhost', 
        sameSite: 'Strict', // allow same site cookies 
        maxAge: 6 * 60 * 60 * 1000, // 6 hours
    },
})
app.use(sessionMiddleware);
// cookieParser allows csruf to access _csrf cookie
app.use(cookieParser());
// csurf middleware configuration for _csrf cookie
const csrfProtection = csrf({
    cookie: {
        httpOnly: true, // cant be accessed via javascript
        secure: process.env.DB_HOST !== 'localhost',  
        sameSite: 'Strict',  
        maxAge: 3600000,  
    }
});
app.use(csrfProtection); // auto generates the _csrf cookie
module.exports = csrfProtection; // must be exported before routes use it 

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
const commentRouter = require('./routes/commentRoutes.js');
const fileRouter = require('./routes/fileRoutes.js');
const friendshipRouter = require('./routes/friendshipRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');

app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/likes', likesRouter);
app.use('/comment', commentRouter);
app.use('/file', fileRouter);
app.use('/friendship', friendshipRouter);
app.use('/message', messageRouter);
// server URLs
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

// route for client to obtain the value stored in _csrf to be attached in http header
app.get('/csrf-token', (req, res) => {
    const csrfToken = req.csrfToken();  // get value stored in _csrf
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
const server = http.createServer(app);
const io = new Server(server);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
const userSockets = new Map(); // userUUID -> socketId

// all defined inside of on('connection') so each socket is independet
io.on('connection', async (socket) => { // called via io(), at the top of header.js on every redirect/refresh
    const userUUID = socket.handshake.query.userUUID;

    socket.on('disconnect', () => {
        if(userSockets.has(userUUID)){
            console.log(`disonnecting ${userUUID} from ${userSockets.get(userUUID)} [${io.sockets.sockets.size}]`);
            userSockets.delete(userUUID);
        }
    });

    if(userUUID) { 
        if(userSockets.has(userUUID)){
            console.log(`disonnecting ${userUUID} from ${userSockets.get(userUUID)} [${io.sockets.sockets.size}]`);
            userSockets.delete(userUUID);
        }
        userSockets.set(userUUID, socket.id);
        socket.userUUID = userUUID; 
        console.log(`${userUUID} connected on socket ${socket.id} [${io.sockets.sockets.size}] at ${Date.now()}`);
    } else {
        console.error('socket.handshake.query.userUUID failed to fetch userUUID');
        return;
    }

    // socket middleware to validate sent message; are they friends?
    socket.use(async ([event, data], next) => {
        if (event !== 'sent-message') return next(); 

        try {
            const mockReq = {
                session: socket.request.session,
                body: { otherUUID: data.recipientUUID },
                params: { otherUUID: data.recipientUUID },
            };
            const mockRes = {
                status: (code) => {
                    mockRes.statusCode = code;
                    return mockRes;
                },
                json: (data) => {mockRes.data = data;},
            };
            console.log("send-message socket validation entered!");
            await validateFriendship(mockReq, mockRes, next);
        } catch (err) {
            // if we get here, the receieve message handler will not get called, I tested it
            console.error('Socket middleware validation failed:', err);
            socket.emit('error', { message: 'Friendship validation failed' });
        }
    });

    // notify recipient client that they recieved a message, 
    socket.on('sent-message', ({ recipientUUID }) => {
        const targetSocketId = userSockets.get(recipientUUID);
        if (targetSocketId) {
            console.log(`sending message to ${recipientUUID}`);
            io.to(targetSocketId).emit('receive-message', {
                from: socket.userUUID,
            });
        }
    });
});


server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
