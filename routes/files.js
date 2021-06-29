"use strict";


const express = require("express");
const router = new express.Router();
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const { UPLOAD_DIR, UPLOAD_URL } = require("../config");
const fs = require("fs");

/** POST /files    { file1, file2, ... } => { [key]:{url, fileName}, ... }
 * Upload files and 
 * Returns uploaded files information
 *
 * Authorization required: login
 */
router.post("/", ensureLoggedIn, function (req, res, next) {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            throw new BadRequestError("No files were uploaded.");
        }

        // console.log('req.files >>>', req.files); // eslint-disable-line

        const username = res.locals.user.username;
        const uploadedFiles = {};

        Object.keys(req.files).forEach(key => {
            const file = req.files[key];

            if (!file.name.match(/.*\.(gif|jpe?g|bmp|png)$/igm)) {
                throw new BadRequestError("Only gif,jpg,jpeg,bmp,png allowed!");
            }

            const uploadDir = `${UPLOAD_DIR}/${username}`;
            const fileName = `${Date.now()}${file.name.substr(file.name.lastIndexOf("."))}`;    //get a new file name by time
            const uploadPath = `${uploadDir}/${fileName}`;
            const url = `${UPLOAD_URL}/${username}/${fileName}`;

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }

            file.mv(uploadPath, function (err) {
                if (err) {
                    return res.status(500).send(err);
                }
            });
            uploadedFiles[key] = {
                url,
                fileName
            };
        });

        res.send(uploadedFiles);

    } catch (err) {
        return next(err);
    }
});

module.exports = router;