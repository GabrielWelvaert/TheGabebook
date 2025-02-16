const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const LikesModel = require("../models/LikesModel.js")
const PostModel = require("../models/PostModel.js")

const LikesController = {
    async likePost(req,res){
        try {
            const postId = req.body.values.postId;
            const userId = req.session.userId; 
            const postExists = await PostModel.postExists(postId);
            // todo verfify that user is authorized to interact with this post!
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }

            const postAuthor = postExists.authorId;
            if(postAuthor != userId){
                return res.status(400).json({success:false, message:"User not authorized to interact with this post"});
            }

            const userHasLikedPost = await LikesModel.userHasLikedPost(postId, userId);


            if(userHasLikedPost){ // unliked the post!
                const result = await LikesModel.dislikePost(postId, userId)
                return res.status(201).json({success: true, message:"Post disliked"});
            } else {
                const result = await LikesModel.likePost(postId, userId)    
                return res.status(201).json({success: true, message:"Post liked"}); 
            }
        } catch (error){
            console.error(`likePost controller Error: ${error.message}`);
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
            const numLikes = await LikesModel.getLikes(postId); 
            const userHasLikedPost = await LikesModel.userHasLikedPost(postId, userId);
            if(userHasLikedPost){
                return res.status(201).json({success: true, userLiked: true, numLikes: numLikes});
            } else {
                return res.status(201).json({success: true, userLiked: false, numLikes: numLikes});
            }
            // todo getLikes controller logic
        } catch (error){
            console.error(`getLikes controller Error: ${error.message}`);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
}

module.exports = LikesController;