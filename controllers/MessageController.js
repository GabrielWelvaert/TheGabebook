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
            let text = req.body.text;
            if(!text){
                return res.status(400).json({success:false, message:"Text Missing!"});
            }
            text = ServerUtils.removeSlurs(text);
            text = ServerUtils.sanitizeInput(text);
            if(!text || text.length == 0){
                return res.status(400).json({success:false, message:"All text lost after sanitization and censoring slurs!"});
            }
            if(!req.params.otherUUID){
                return res.status(400).json({success:false, message:"Missing recipient"});
            }
            if(text.length > 2000){
                return res.status(400).json({success:false, message:`text too long ${text.length}/2000`});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.params.otherUUID);
            if(selfId == otherId){
                return res.status(400).json({success:false, message:"Attempted to send message to self"});
            }
            const messageSent = await MessageModel.sendMessage(selfId, otherId, datetime, text);
            if(messageSent){
                return res.status(200).json({success:true, datetime:datetime, text:text});
            } else {
                return res.status(400).json({success:false, message:"Message failed to send"});
            }
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async getActiveConversationFriends(req,res){ // horrible
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
    },
    async getConversation(req,res){
        try {
            const selfId = req.session.userId;
            if(!req.params.otherUUID){
                return res.status(400).json({success:false, message:"Missing recipient"});
            }
            const otherId = await UserModel.getUserIdFromUUID(req.params.otherUUID);
            const currentConversation = await MessageModel.getConversation(selfId, otherId);
            if(currentConversation){
                return res.status(200).json({success:true, currentConversation:currentConversation});
            } else {
                return res.status(400).json({success:false, message:"Failed to fetch currentConversation"});
            }
        } catch (error){
            console.error(error.message);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    }
};

module.exports = MessageController;