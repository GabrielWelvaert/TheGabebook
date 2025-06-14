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
                return res.status(200).json({success: false, message:"Password Reset Instructions have been emailed"});
            }
            // create the reset token
            const token = uuidv4();
            const expiry = ServerUtils.getTokenExpiry();
            const createResetToken = await PasstokenModel.createResetToken(userId, token, expiry);
            if(!createResetToken){
                return res.status(400).json({success: false, message:"Server Error"});
            }
            PasstokenModel.cullExpiredTokens();
            ServerUtils.sendEmail(email, 'reset', token);
            return res.status(200).json({success: true, message:"Password Reset Instructions have been emailed"});
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async validateResetToken(req,res){
        try {
            const token = req.params.token;
            const validToken = await PasstokenModel.isValidResetToken(token);
            if(!validToken){
                return res.redirect('/?message=invalid-token');
            }
            return res.sendFile(path.join(__dirname, '..', 'views', 'resetPassword.html'));
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async createConfirmToken(req,res){
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
            const hasUnexpiredToken = await PasstokenModel.userHasActiveConfirmToken(userId);
            if(hasUnexpiredToken){
                return res.status(200).json({success: false, message:"Account Confirmation Instructions have been emailed"});
            }
            // create the reset token
            const token = uuidv4();
            const expiry = ServerUtils.getTokenExpiry();
            const createConfirmToken = await PasstokenModel.createConfirmToken(userId, token, expiry);
            if(!createConfirmToken){
                return res.status(400).json({success: false, message:"Server Error"});
            }
            PasstokenModel.cullExpiredTokens();
            ServerUtils.sendEmail(email, 'confirm', token);
            return res.status(200).json({success: true, message:"Account Confirmation Instructions have been emailed"});
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
    async validateConfirmToken(req,res){
        try {
            const token = req.params.token;
            const validToken = await PasstokenModel.isValidConfirmToken(token);
            if(!validToken){
                return res.redirect('/?message=invalid-token');
            }
            UserModel.confirmUser(validToken.userId);
            return res.redirect('/?message=confirmed');
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({success: false, message: `Server Error`});
        }
    },
}

module.exports = PasstokenController;