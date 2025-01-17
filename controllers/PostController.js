const PostModel = require("../models/PostModel.js")
const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const textLimit = parseInt(process.env.POST_MAX_TEXT);

const PostController = {
    async submitPost(req, res){
        const values = {authorId: req.session.userId,text:req.body.values.text, media: "",datetime: ServerUtils.getCurrentDateTime()};
        try {
            let numberOfTabsNewlines = ServerUtils.countTabsAndNewlines(req.body.values.text);
            if(numberOfTabsNewlines > 3){
                return res.status(400).json({success: false, message:"Your post may not use more than 3 tabs or newlines"});
            }
            if(values.text.length >= textLimit){
                return res.status(400).json({success: false, message:"Text too long"});
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