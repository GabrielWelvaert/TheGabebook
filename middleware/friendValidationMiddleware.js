const FriendshipModel = require("../models/FriendshipModel");
const UserModel = require("../models/UserModel.js");

const validateFriendship = async (req,res,next) => {
    const otherUUID = req.body.userUUID ?? req.params.userUUID;
    if(!otherUUID){ // action is being performed on self
       return next();
    }
    const selfId = req.session.userId;
    const otherId = await UserModel.getUserIdFromUUID(otherUUID);
    if(!otherId){
        console.error("other UUID error in validateFriendship middleware");
        return res.status(400).json({success:false, message:"otherUUID error"});
    }
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