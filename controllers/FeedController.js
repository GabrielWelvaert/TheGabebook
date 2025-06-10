const FeedModel = require("../models/FeedModel.js");
const path = require('path');

const FeedController = {
    async getFeed(req, res){
        res.sendFile(path.join(__dirname, '..', 'views', 'feed.html')); // automatically sets status to 200
    },
}

module.exports = FeedController;