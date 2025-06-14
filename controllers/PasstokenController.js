const path = require('path');
const bcrypt = require('bcrypt');
const ServerUtils = require('./serverUtils.js');
const { v4: uuidv4 } = require('uuid');
const PasstokenModel = require("../models/PasstokenModel");
const UserModel = require('../models/UserModel.js');

const PasstokenController = {
    async createResetToken(req,res){
        try {
            // was an email passsed? 
            const email = req.body.email;
            if(!email || email.length > process.env.SMALL_VARCHAR_SIZE){
                return res.status(400).json({success: false, message:"Email Missing Or Invalid"});
            }
            // does a user exist with this email
            const userId = await UserModel.getUserIdFromEmail(email);
            if(!userId){
                return res.status(400).json({success: false, message:"Account not found"});
            }
            // check if they have a non-expired password reset token
            const hasUnexpiredToken = await PasstokenModel.userHasActiveResetToken(userId);
            if(hasUnexpiredToken){
                return res.status(400).json({success: false, message:"Reset link already sent"});
            }
            // create the reset token
            const token = uuidv4();
            const expiry = ServerUtils.getTokenExpiry();
            const createResetToken = await PasstokenModel.createResetToken(userId, token, expiry);
            if(!createResetToken){
                return res.status(400).json({success: false, message:"Server Error"});
            }
            return res.status(200).json({success: true, message:"Instructions have been sent to your email"});
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async validateResetToken(req,res){
        try {

        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async createConfirmToken(req,res){
        try {

        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async validateConfirmToken(req,res){
        try {

        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
}

module.exports = PasstokenController;