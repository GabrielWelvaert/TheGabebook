const db = require('../config/db.js');

const CommentModel = {
    async getAllCommentsForPost(postId){
        console.log(postId);
        return undefined;
    }
}

module.exports = CommentModel;