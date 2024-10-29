const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;

// gives server accesss to static JS and CSS files
app.use(express.static(path.join(__dirname, 'public')));

// server URLs
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

// start the server
app.listen(PORT, () => {

})