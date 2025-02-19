const CommentModel = require("../models/CommentModel");
const ServerUtils = require('./serverUtils.js');
const PostModel = require("../models/PostModel.js")

const CommentController = {
    async submitComment(req, res){
        try {
            console.log(`submitComment controller entered with ${req.params}`);
            const postId = req.params.postId;
            const postExists = await PostModel.postExists(postId);
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const comment = CommentModel.submitComment(req.params);
        } catch (error){
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = CommentController;