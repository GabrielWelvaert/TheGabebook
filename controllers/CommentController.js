const CommentModel = require("../models/CommentModel");
const ServerUtils = require('./serverUtils.js');
const PostModel = require("../models/PostModel.js")
const { v4: uuidv4 } = require('uuid');

const CommentController = {
    async submitComment(req, res){
        try {
            let text = req.body.text;
            text = ServerUtils.removeSlurs(text);
            text = ServerUtils.sanitizeInput(text);
            if(text.length == 0){
                return res.status(400).json({success:false, message:"Comment too short"});
            }
            let authorId = req.session.userId;
            let postId = await PostModel.getPostIdFromUUID(req.body.postUUID);
            let datetime = ServerUtils.getCurrentDateTime();
            let commentUUID = uuidv4();
            const values = {commentUUID, authorId, text, datetime, postId};
            const postExists = await PostModel.postExists(postId);
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const comment = await CommentModel.submitComment(values);
            let notify = false;
            let notificationData = {};
            if(postExists.authorId != req.session.userId){ // did not comment on own post -- should generate notification for recipient
                const commentId = await CommentModel.getCommentIdFromUUID(comment.commentUUID);
                notificationData = await CommentModel.getNotificationInfoFromCommentId(commentId);
                notify = true;
            }
            return res.status(201).json({success: true, message:"Comment submitted", comment:comment, notify:notify,  postUUID:notificationData.postUUID || null, authorUUID:notificationData.authorUUID || null});
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    },
    async deleteComment(req, res){ // self only
        try {
            let commentId = await CommentModel.getCommentIdFromUUID(req.body.commentUUID);
            let sessionUserId = req.session.userId;
            const comment = await CommentModel.commentExists(commentId);
            if(!comment){
                console.error("comment does not exist");
                return res.status(400).json({success:false, message:"Comment does not exist"});
            }
            // comments must be associated with a post. this should never not be the case!
            const post = await PostModel.postExists(comment.postId);
            if(!post){
                console.error("post does not exist");
                return res.status(400).json({success:false, message:"Post does not exist"});
            }
            // user can only delete a comment if its under their post or if its their comment
            let sessionUserOwnsComment = sessionUserId == comment.authorId;
            let sessionUserOwnsPost = sessionUserId == post.authorId;
            if(!sessionUserOwnsComment && !sessionUserOwnsPost){ 
                console.error("unauthorized to delete this comment");
                return res.status(403).json({success:false, message:"User not authorized to delete this comment"});
            }
            const success = await CommentModel.deleteComment(commentId);
             if(success){
                return res.status(201).json({success:success}); 
            } else {
                return res.status(400).json({success: false, message:"Comment deletion error"});
            }
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = CommentController;