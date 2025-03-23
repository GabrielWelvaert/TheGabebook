const CommentModel = require("../models/CommentModel");
const ServerUtils = require('./serverUtils.js');
const PostModel = require("../models/PostModel.js")

const CommentController = {
    async submitComment(req, res){
        try {
            let text = req.body.text;
            let authorId = req.session.userId;
            let postId = req.body.postId;
            let datetime = ServerUtils.getCurrentDateTime();
            const values = {authorId, text, datetime, postId};
            const postExists = await PostModel.postExists(postId);
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const comment = await CommentModel.submitComment(values);
            return res.status(201).json({success: true, message:"Comment submitted", comment:comment});
        } catch (error){
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    },
    async deleteComment(req, res){
        try {
            let commentId = req.body.commentId;
            let sessionUserId = req.session.userId;
            const comment = await CommentModel.commentExists(commentId);
            if(!comment){
                return res.status(400).json({success:false, message:"Comment does not exist"});
            }
            // comments must be associated with a post. this should never not be the case!
            const post = await PostModel.postExists(comment.postId);
            if(!post){
                return res.status(400).json({success:false, message:"Post does not exist"});
            }
            // user can only delete a comment if its under their post or if its their comment
            if(sessionUserId != comment.authorId || sessionUserId != post.authorId){ 
                return res.status(400).json({success:false, message:"User not authorized to delete this comment"});
            }
            const success = await CommentModel.deleteComment(commentId);
             if(success){
                return res.status(201).json({success:success}); 
            } else {
                return res.status(400).json({success: false, message:"Comment deletion error"});
            }
        } catch (error){
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = CommentController;