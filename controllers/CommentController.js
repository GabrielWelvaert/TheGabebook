const CommentModel = require("../models/CommentModel");
const ServerUtils = require('./serverUtils.js');
const PostModel = require("../models/PostModel.js")

const CommentController = {
    async getCommentsForPost(req,res){
        console.log("entered comment controller");
        try {
            const postId = req.params.postId;
            const postExists = await PostModel.postExists(postId);
            const authorId = postExists.authorId;
            const userId = req.session.userId; 
            const userIsAuthor = authorId == userId;
            if(!postExists){
                return res.status(400).json({success:false, message:"Post does not exist"})
            }
            const posts = await CommentModel.getAllCommentsForPost(postId);

        } catch (error){
            return res.status(500).json({success:false, message: `Server Error: ${error.message}`});
        }
    }
}

module.exports = CommentController;