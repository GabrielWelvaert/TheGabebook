const PostModel = require("../models/PostModel.js")
const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const textLimit = parseInt(process.env.POST_MAX_TEXT);

const PostController = {
    async submitPost(req, res){
        try {
            let text = ServerUtils.sanitizeInput(req.body.text);
            const values = {authorId: req.session.userId,text:text, media: "",datetime: ServerUtils.getCurrentDateTime()};
            let numberOfTabsNewlines = ServerUtils.countTabsAndNewlines(text);
            if(numberOfTabsNewlines > 3){
                return res.status(400).json({success: false, message:"Your post may not use more than 3 tabs or newlines"});
            }
            if(values.text.length >= textLimit){
                return res.status(400).json({success: false, message:"Excessive post length"});
            }
            if(!values.text || values.text.length < 4 || values.text.trim().length === 0){
                return res.status(400).json({success: false, message:"Your post is too short or only contains spaces"});
            }

            const post = await PostModel.createPost(values);
            return res.status(201).json({success: true, message:"Post submitted", post:post});

        } catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`}); 
        }
    },
    async getPosts(req, res){
        try {
            const posts = await PostModel.getPosts(req.session.userId);
            return res.status(201).json({success:true, posts: posts});
        } catch (error) {
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`}); 
        }
    },
    async getAllCommentsForPost(req,res){ 
        try {

            const comments = await PostModel.getAllCommentsForPost(req.userId, req.postId);
            return res.status(201).json({success:true, comments: comments});
        } catch (error) {
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`}); 
        }
    },
    async deletePost(req,res){
        try {
            const values = {postId: req.body.postId, authorId: req.session.userId}; 
            const postExists = await PostModel.postExists(req.body.postId);
            let success = false;
            if(postExists && req.session.userId == postExists.authorId){
                success = await PostModel.deletePost(values);
            } 
            if(success) {
                return res.status(201).json({success:success}); 
            } else {
                return res.status(400).json({success: false, message:"Post deletion error"});
            }
        } catch (error) {
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    }
}

module.exports = PostController;