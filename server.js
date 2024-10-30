const express = require('express');
const db = require('./config/db.js')
const app = express();
const path = require('path');
const PORT = 3000;

const userRouter = require('./routes/userRoutes.js')

// middleware for url parameters
app.use(express.urlencoded({extended:false}));
// middleware for json
app.use(express.json());
// gives server accesss to static JS and CSS files
app.use(express.static(path.join(__dirname, 'public')));
// these will be applied to all routes below!!!

app.use('/user', userRouter);

// server URLs
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'landing.html'));
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