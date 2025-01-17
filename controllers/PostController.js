const PostModel = require("../models/PostModel.js")
const path = require('path');
const bcrypt = require('bcrypt');

const textLimit = parseInt(process.env.POST_MAX_TEXT);

function countTabsAndNewlines(str) {
    const tabCount = (str.match(/\t/g) || []).length;  // Count tabs
    const newlineCount = (str.match(/\n/g) || []).length;  // Count newlines

    // Return the sum of tabs and newlines
    return tabCount + newlineCount;
}

const PostController = {
    async submitPost(req, res){
        const values = {authorId: req.session.userId,text:req.body.values.text, media: "",datetime: req.body.values.datetime};
        try {
            let numberOfTabsNewlines = countTabsAndNewlines(req.body.values.text);
            if(numberOfTabsNewlines > 3){
                return res.status(400).json({success: false, message:"Your post may not use more than 3 tabs or newlines"});
            }
            if(values.text.length >= textLimit){
                return res.status(400).json({success: false, message:"Length too large error. Try consolidating your thoughts"});
            }
            if(values.text.length < 4 || values.text.trim().length === 0){
                return res.status(400).json({success: false, message:"Your post is too short or only contains spaces"});
            }
            if(!req.session.userId){
                return res.status(401).json({success: false, message:"Session expired"});
            }
            const post = await PostModel.createPost(values);
            return res.status(201).json({success: true, message:"Post submitted"});

        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`}); 
        }
    },
    async getPosts(req, res){
        try {
            const userId = req.session.userId; 
            if(!req.session.userId){
                return res.status(401).json({success: false, message:"Session expired"});
            }
            const posts = await PostModel.getPosts(userId);
            return res.status(201).json({success:true, posts: posts});
        } catch (error) {
            return res.status(500).json({success: false, message: `Server Error: ${error}`}); 
        }
    }
}

module.exports = PostController;