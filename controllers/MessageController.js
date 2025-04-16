const path = require('path');
const ServerUtils = require('./serverUtils.js');
const MessageModel = require("../models/MessageModel");
const UserModel = require("../models/UserModel");

const MessageController = {
    async messages(req,res){ // redirects to message page!
        res.sendFile(path.join(__dirname, '..', 'views', 'messages.html'));
    },
    async sendMessage(req,res){
        try {
            const selfId = req.session.userId;
            const datetime = ServerUtils.getCurrentDateTime();
            const text = req.params.text;
            if(!req.params.otherUUID){
                return res.status(400).json({success:false, message:"!req.params.otherUUID"});
            }
            if(text.length > 2000){
                return res.status(400).json({success:false, message:`text too long ${text.length}/2000`});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.params.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false, message:"selfId == otherId"});
            }
            const messageSent = await MessageModel.sendMessage(selfId, otherId);
            if(messageSent){
                return res.status(200).json({success:true, datetime:datetime});
            } else {
                return res.status(400).json({success:false, message:"Message failed to send"});
            }
        } catch (error){
            console.error(error.messages);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async getActiveConversationFriends(req,res){
        try {
            const selfId = req.session.userId;
            const previousConversations = await MessageModel.getActiveConversationFriends(selfId);
            if(previousConversations){
                return res.status(200).json({success:true, previousConversations:previousConversations});
            } else {
                return res.status(400).json({success:false, message:"Failed to fetch previous conversations"});
            }
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
};

module.exports = MessageController;