const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const LikesModel = require("../models/LikesModel.js")
const PostModel = require("../models/PostModel.js");
const CommentModel = require('../models/CommentModel.js');
const UserModel = require('../models/UserModel.js');

const LikesController = {
    async likePost(req,res){
        try {
            const postId = await PostModel.getPostIdFromUUID(req.body.postUUID);
            const userId = req.session.userId; 
            const postExists = await PostModel.postExists(postId);
            // todo verfify that user is authorized to interact with this post!
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }

            const userHasLikedPost = await LikesModel.userHasLikedPost(postId, userId);
            let message;
            if(userHasLikedPost){ // unliked the post!
                const result = await LikesModel.dislikePost(postId, userId)
                message = "Post disliked";
            } else {
                const result = await LikesModel.likePost(postId, userId)    
                message = "Post liked";
            }
            const authorId = postExists.authorId;
            let authorUUID = null;
            let notify = false;
            if(userId != authorId){
                authorUUID = await UserModel.getUUIDFromUserId(authorId);    
                notify = true;
            }
            return res.status(201).json({success: true, message:message, notify:notify, postUUID:req.body.postUUID, authorUUID:authorUUID}); 
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async likeComment(req,res){
        try {
            const commentId = await CommentModel.getCommentIdFromUUID(req.body.commentUUID);
            const userId = req.session.userId; 
            const commentExists = await CommentModel.commentExists(commentId);
            if(!commentExists){
                return res.status(400).json({success:false, message:"Comment does not exist"})
            }
            const postExists = await PostModel.postExists(commentExists.postId);
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }

            const userHasLikedComment = await LikesModel.userHasLikedComment(commentId, userId);

            let message;
            if(userHasLikedComment){ // unliked the comment!
                const result = await LikesModel.dislikeComment(commentId, userId);
                message = "Comment disliked";
            } else {
                const result = await LikesModel.likeComment(commentId, userId);    
                message = "Comment liked";
            }
            let notify = false;
            let notificationData = {};
            if(userId != commentExists.authorId && !userHasLikedComment){
                notificationData = await CommentModel.getNotificationInfoFromCommentId(commentId);
                if(notificationData){
                    notify = true;
                }    
            }
            return res.status(201).json({success: true, message:message, notify:notify, postUUID:notificationData.postUUID || null, authorUUID:notificationData.commentAuthorUUID || null}); 
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async getLikesAndUserLiked(req,res){ // total likes and if the user has liked the post
        try {
            const postId = req.params.postId;
            const postExists = await PostModel.postExists(postId);
            const userId = req.session.userId; 
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const numLikes = await LikesModel.getLikesForPost(postId); 
            const userHasLikedPost = await LikesModel.userHasLikedPost(postId, userId);
            if(userHasLikedPost){
                return res.status(201).json({success: true, userLiked: true, numLikes: numLikes});
            } else {
                return res.status(201).json({success: true, userLiked: false, numLikes: numLikes});
            }
            // todo getLikesForPost controller logic
        } catch (error){
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
}

module.exports = LikesController;