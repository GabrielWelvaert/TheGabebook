const db = require("../config/db.js");
const { promisify } = require('util');

const authenticate = async (req, res, next) => { 
    let badSession = false;
    let reason = "";
    if(!req.session){
        badSession = true;
        reason += "req.session does not exist ";
    } 
    if(!req.session.userId){
        badSession = true;
        reason += "req.session.userId does not exist ";
    }
    if(!req.session.cookie){
        badSession = true;
        reason += "req.session.cookie does not exist ";
    }
    if((req.session.cookie.expires && new Date(req.session.cookie.expires).getTime() < Date.now())){
        badSession = true;
        reason += "cookied has expired ";
    }

    if(badSession){
        console.error(`BAD SESSION: ${reason}`);
        if (req.method === 'GET' && !req.headers['x-requested-with']) { // manual refresh
            return res.redirect('/');
        } else { // call site is a fetch(); must handle redirect on client side
            return res.status(401).json({ success: false, message: "Session expired" });
        }
    }
    return next();
}

module.exports = authenticate;