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
const FileStore = require('session-file-store')(session);

const PORT = 3000;
const app = express();

app.set('trust proxy', 1); // trust the reverse proxy -- second param should be derived from .env but I dont care for now 
// middleware are automatically applied to all http requests, before they execute (or selectively)
// middleware for url parameters
app.use(express.urlencoded({extended:true}));
// middleware for json
app.use(express.json());
// everything in public folder can be accessed as if they were at root
app.use(express.static(path.join(__dirname, 'public')));
// configuring express-session middleware for server-side sessions
const sessionMiddleware = session({ 
    store: new FileStore({
        path: '/tmp/sessions',
        retries: 1
    }),
    secret: process.env.SESSION_SECRET_KEY, 
    resave: false,
    saveUninitialized: true,
    cookie: { // session cookie (connection.sid)
        httpOnly: true, // cant be accessed via javascript
        secure: true, // here
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
        secure: true,  
        sameSite: 'Strict',  
        maxAge: 3600000,  
    }
});
app.use(csrfProtection); // auto generates the _csrf cookie
module.exports = csrfProtection; // must be exported before routes use it 

// these will be applied to all routes below!!!
const userRouter = require('./routes/userRoutes.js');
const postRouter = require('./routes/postRoutes.js');
const likesRouter = require('./routes/likesRoutes.js');
const commentRouter = require('./routes/commentRoutes.js');
const fileRouter = require('./routes/fileRoutes.js');
const friendshipRouter = require('./routes/friendshipRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');
const notificationRouter = require('./routes/notificationRoutes.js');
const FeedRouter = require('./routes/feedRoutes.js');
const passtokenRouter = require('./routes/passtokenRoutes.js');

app.use('/user', userRouter); // login and register are exempt from authentication
app.use('/post', authenticate, postRouter);
app.use('/likes', authenticate, likesRouter);
app.use('/comment', authenticate, commentRouter);
app.use('/file', authenticate, fileRouter);
app.use('/friendship', authenticate, friendshipRouter);
app.use('/message', authenticate, messageRouter);
app.use('/notification', authenticate, notificationRouter);
app.use('/feed', authenticate, FeedRouter);
app.use('/passtoken', passtokenRouter); // exempt from authentication

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
    sessionMiddleware(socket.request, {}, next); // allows socket to access middleware
});
const userSockets = new Map(); // userUUID -> socketId

// all defined inside of on('connection') so each socket is independet
io.on('connection', async (socket) => { // called via io(), at the top of header.js on every redirect/refresh
    const userUUID = socket.handshake.query.userUUID;

    socket.on('disconnect', () => {
        if(userSockets.has(userUUID)){
            // console.log(`disonnecting ${userUUID} from ${userSockets.get(userUUID)} [${io.sockets.sockets.size}]`);
            userSockets.delete(userUUID);
        }
    });

    if(userUUID) { 
        if(userSockets.has(userUUID)){
            // console.log(`disonnecting ${userUUID} from ${userSockets.get(userUUID)} [${io.sockets.sockets.size}]`);
            userSockets.delete(userUUID);
        }
        userSockets.set(userUUID, socket.id);
        socket.userUUID = userUUID; 
        // console.log(`${userUUID} connected on socket ${socket.id} [${io.sockets.sockets.size}] at ${Date.now()}`);
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
            await validateFriendship(mockReq, mockRes, next);
        } catch (err) {
            // if we get here, the receieve message handler will not get called, I tested it
            socket.emit('error', { message: 'Friendship validation failed' });
        }
    });

    // notify recipient client that they recieved a message, 
    socket.on('sent-message', ({ recipientUUID, messageUUID }) => {
        const targetSocketId = userSockets.get(recipientUUID);
        if(targetSocketId){
            io.to(targetSocketId).emit('receive-message', {
                from: socket.userUUID,
                messageUUID
            });
        }
    });
    
    // action = create: notify recipient client that they recieved an incoming friend request
    // action = terminate: notify recipient client that an incoming friend request was cancelled by initiator
    socket.on('sent-outgoing-friend-request-update', ({action, recipientUUID}) => {
        const targetSocketId = userSockets.get(recipientUUID);
        if(targetSocketId){
            io.to(targetSocketId).emit('receive-outgoing-friend-request-update', {
                from: socket.userUUID,
                action
            });
        }
    });

    // client will refresh page if viewing profile of someone they have a pending outgoing request with
    socket.on('sent-accept-friend-request', ({recipientUUID}) => {
        const targetSocketId = userSockets.get(recipientUUID);
        if(targetSocketId){
            io.to(targetSocketId).emit('receive-accept-friend-request', {
                from: socket.userUUID,
            });
        }
    });

    socket.on('send-notificaiton', ({recipientUUID}) => {
        const targetSocketId = userSockets.get(recipientUUID);
        if(targetSocketId){
            io.to(targetSocketId).emit('receive-notification', {
                from: socket.userUUID,
            });
        }
    });
});


server.listen(PORT, () => { // same as binding to '0.0.0.0' -- correct for reverse proxy w/ caddy
    console.log(`Server running on port ${PORT}`);
});
