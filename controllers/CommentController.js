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
            console.log(`submitComment controller entered with ${req.body.postId}`);
            const postExists = await PostModel.postExists(postId);
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const comment = CommentModel.submitComment(values);
            return res.status(201).json({success: true, message:"Comment submitted"});
        } catch (error){
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = CommentController;