const PostModel = require("../models/PostModel.js")
const path = require('path');
const bcrypt = require('bcrypt');

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
            if(!req.session.userId){
                return res.status(401).json({success: false, message:"Session expired"});
            }
            //todo check if post is clean to interact with database
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