const db = require("../config/db.js");
const { promisify } = require('util');

const authenticate = async (req, res, next) => {
    if (!req.session || 
        !req.session.userId ||
        !req.session.cookie || 
        (req.session.cookie.expires && new Date(req.session.cookie.expires).getTime() < Date.now()) ) {
        console.error("SESSION EXPIRED!");
        if (req.method === 'GET' && !req.headers['x-requested-with']) { // manual refresh
            return res.redirect('/');
        } else { // call site is a fetch(); must handle redirect on client side
            return res.status(401).json({ success: false, message: "Session expired" });
        }
    }
    next();
}

module.exports = authenticate;