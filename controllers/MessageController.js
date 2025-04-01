const path = require('path');
const ServerUtils = require('./serverUtils.js');

const MessageController = {
    async messages(req,res){ // redirects to message page!
        res.sendFile(path.join(__dirname, '..', 'views', 'messages.html'));
    }
};

module.exports = MessageController;