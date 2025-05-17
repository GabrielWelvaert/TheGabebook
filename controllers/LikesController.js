const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const LikesModel = require("../models/LikesModel.js")
const PostModel = require("../models/PostModel.js");
const CommentModel = require('../models/CommentModel.js');
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

            // const postAuthor = postExists.authorId;
            // if(postAuthor != userId){
            //     return res.status(400).json({success:false, message:"User not authorized to interact with this post"});
            // }

            const userHasLikedPost = await LikesModel.userHasLikedPost(postId, userId);


            if(userHasLikedPost){ // unliked the post!
                const result = await LikesModel.dislikePost(postId, userId)
                return res.status(201).json({success: true, message:"Post disliked"});
            } else {
                const result = await LikesModel.likePost(postId, userId)    
                return res.status(201).json({success: true, message:"Post liked"}); 
            }
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
            const notificationData = await CommentModel.getNotificationInfoFromCommentId(commentId);
            return res.status(201).json({success: true, message:message, postUUID:notificationData.postUUID, authorUUID:notificationData.authorUUID}); 
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