const db = require('../config/db.js');

const CommentModel = {
    async submitComment(data){
        console.log(data);
        return undefined;
    }
}

module.exports = CommentModel;