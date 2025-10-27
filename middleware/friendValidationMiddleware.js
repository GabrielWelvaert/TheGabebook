const FriendshipModel = require("../models/FriendshipModel");
const UserModel = require("../models/UserModel.js");

const validateFriendship = async (req,res,next) => {
    const otherId = req.body.otherId ?? req.params.otherId;
    if(!otherId){ // action is being performed on self
       return next();
    }
    const selfId = req.session.userId;
    if(selfId != otherId){
        const friendshipData = await FriendshipModel.getStatus(selfId, otherId);
        if(!friendshipData || friendshipData.pending){
            console.error("Friendship Validation failed");
            return res.status(403).json({success:false, message:"Friendship Required"});
        }
    }
    return next();
}

module.exports = validateFriendship;