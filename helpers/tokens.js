const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { ROLE_USER } = require("../models/role");

/**
 * return signed JWT from user data.
 * @param {Object} user 
 * @returns token
 */
function createToken(user) {
    console.assert(user.role !== undefined,
        "createToken passed user without role property");

    let payload = {
        username: user.username,
        role: user.role || ROLE_USER,
    };

    return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
