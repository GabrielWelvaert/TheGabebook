const UserModel = require("../models/UserModel.js")
const path = require('path');
const bcrypt = require('bcrypt');

// this function expects dateString to be passed as a SQL date string ex: "1900-01-01"
// its purpose is to re-test the birthday on the server side
function validBirthday(dateString){ 
    const year = parseInt(dateString.slice(0,4));
    const month = parseInt(dateString.slice(5,7));
    const day = parseInt(dateString.slice(8,10));
    let maxDaysThisMonth = 0;
    // this switch case will correctly update the maxDaysThisMonth int so that we can
    // make sure we have a legal amount of days 
    switch(month){
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:{
            maxDaysThisMonth = 31;
            break;
        }
        case 4:
        case 6:
        case 9:
        case 11:{
            maxDaysThisMonth = 30;
            break;
        }
        case 2:{
            if(year && ((year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0))){ // leap year
                maxDaysThisMonth = 29;  
            } else {
                maxDaysThisMonth = 28; 
            }
            break;
        }
        default:{
            console.error(`validBirthday() Invalid month: (${month})`);
            return false;
        }
    }

    if(day < 0 || year < 1900 || year > 2024 || day > maxDaysThisMonth){
        console.error(`day ${day} invalid for month ${month} with year ${year}`);
        return false;
    }
    return true;
}

const UserController = {
    async registerUser(req, res){
        // ensure names and emails dont have trailing/leading spaces
        req.body.firstName.trim();
        req.body.lastName.trim();
        req.body.email.trim();
        const { firstName, lastName, email, password, confirmedPassword, birthday } = req.body;
        const smallVarCharSize = parseInt(process.env.SMALL_VARCHAR_SIZE);
        const passwordVarCharSize = parseInt(process.env.PASSWORD_VARCHAR_SIZE);
        try {

            // check if any forms were left empty
            if(!firstName || !lastName || !email || !password || !birthday){
                return res.status(400).json({success: false, message:"All fields are required"});
            }

            // validate birthday
            if(birthday.length != 10 || !validBirthday(birthday)){
                return res.status(400).json({success:false, message:"Birthday Format Error!"})
            }
            
            // todo check size of small var char fields            
            if(firstName.length > smallVarCharSize || lastName.length > smallVarCharSize || email.length > smallVarCharSize){
                return res.status(400).json({success:false, message:"Name and email fields must not be more than 45 characters in length"})
            }

            // check if this email is already registered
            const existingUser = await UserModel.findUserByEmail(email);
            if(existingUser){
                return res.status(400).json({success: false, message: "Email already registered; log-in instead!"});
            }

            // check if password and confirmed password match
            if(confirmedPassword !== password){
                return res.status(400).json({success: false, message:"Passwords do not match"});
            }
  
            if(/^(.)\1*$/.test(password) || password.length <= 3) {
                return res.status(400).json({success: false, message:"Password must have at least 2 unique characters and have a length of at least 4"});
            } 

            // hash the passwords in the req.body after it is confirmed to match
            req.body.password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
            if(req.body.password.length > passwordVarCharSize){
                return res.status(400).json({success: false, message:"Critical Error: Hashed Password is too long. Try using a shorter password. If you believe this is an error, contact an Admin"});
            } 

            // register new user if no issues found!
            const newUser = await UserModel.createUser(req.body);
            return res.status(201).json({success: true, message:"User registered successfully", user: newUser}); 
        } catch (error){
            console.error("Error registering user: ", error);
            return res.status(500).json({success: false, message: "Server Error"});
        }
    },
    async loginUser(req, res){
        const {email,password} = req.body;
        try{
            // check if any forms are empty
            if(!email || !password){
                return res.status(400).json({success: false, message:"All fields are required"});
            }
            // check if this email is registered
            const existingUser = await UserModel.findUserByEmail(email);
            if(!existingUser){
                return res.status(400).json({success: false, message: "Email not registered; Sign-Up below"});
            }
            // check if password was incorrect
            const sessionUser = {firstName: existingUser.firstName, lastName:existingUser.lastName};
            const correctPassword = await UserModel.validatePassword(email, password);
            if(correctPassword){
                return res.status(200).json({success: true, message:"Successful login", sessionUser:sessionUser}); 
            } else {
                return res.status(401).json({success: false, message: "Incorrect password"});
            }
        }catch (error){
            return res.status(500).json({success: false, message: `Server Error: ${error}`});
        }
    },
    async profilePage(req, res){
        res.sendFile(path.join(__dirname, '..', 'views', 'profile.html')); // automatically sets status to 200
    }
}

module.exports = UserController;