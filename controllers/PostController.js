const PostModel = require("../models/PostModel.js")
const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const textLimit = parseInt(process.env.POST_MAX_TEXT);
const UserModel = require("../models/UserModel.js")
const { v4: uuidv4 } = require('uuid');
const FriendshipController = require("./FriendshipController.js");
const FriendshipModel = require("../models/FriendshipModel.js");

const PostController = {
    async submitPost(req, res){ // possible for self only
        try {
            let text = ServerUtils.sanitizeInput(req.body.text);
            text = ServerUtils.removeSlurs(text);
            let postUUID = uuidv4();
            const values = {postUUID: postUUID, authorId: req.session.userId,text:text, media: "",datetime: ServerUtils.getCurrentDateTime()};
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
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`}); 
        }
    },
    async getPosts(req, res){ // possible for self and other. gets posts for a given user
        try {
            // userId is that of currently viewed profile
            let profileUserId = req.params.userUUID ? await UserModel.getUserIdFromUUID(req.params.userUUID) : req.session.userId;
            let sessionUserId = req.session.userId;
            const posts = await PostModel.getPosts(profileUserId, sessionUserId);
            return res.status(201).json({success:true, posts: posts});
        } catch (error) {
            console.error(error.message);
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
    async deletePost(req,res){ // possible for self only
        try {
            let postId = await PostModel.getPostIdFromUUID(req.body.postUUID);
            const values = {postId: postId, authorId: req.session.userId}; 
            const postExists = await PostModel.postExists(postId);
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
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`});
        }
    },
    async getFeed(req,res){
        try {
            let sessionUserId = req.session.userId;
            // 1) get confirmed friends Id's
            const Ids = [sessionUserId];
            const friendIds = await FriendshipModel.getIdsOfAllFriends(sessionUserId);
            if(friendIds){
                Ids.push(...friendIds);
            }            
            // 2) get posts from all confirmed friends
            const posts = await PostModel.getFeed(Ids);
            if(!posts){
                return res.status(400).json({success: false, message:"get feed error"});
            }
            return res.status(201).json({success:true, posts: posts});
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = PostController;