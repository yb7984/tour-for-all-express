"use strict";


const express = require("express");
const router = new express.Router();
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const { UPLOAD_DIR, UPLOAD_URL, S3_UPLOAD } = require("../config");
const fs = require("fs");

/** POST /files    { file1, file2, ... } => { [key]:{url, fileName}, ... }
 * Upload files and 
 * Returns uploaded files information
 *
 * Authorization required: login
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            throw new BadRequestError("No files were uploaded.");
        }

        const username = res.locals.user.username;
        const uploadedFiles = {};

        for (const key of Object.keys(req.files)) {
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

            if (S3_UPLOAD) {
                await uploadToS3(uploadPath, username);
            }
            uploadedFiles[key] = {
                url,
                fileName
            };
        }

        res.send(uploadedFiles);

    } catch (err) {
        return next(err);
    }
});

/**
 * Upload to S3
 * @param {String} file 
 * @param {String} folder 
 * @param {String} bucket 
 */
async function uploadToS3(file, folder = "null", bucket = "tourforall") {

    // Load the AWS SDK for Node.js
    const AWS = require('aws-sdk');

    // Configure the file stream and obtain the upload parameters
    const fs = require('fs');
    const fileStream = fs.createReadStream(file);
    fileStream.on('error', function (err) {
        console.log('File Error', err);
    });
    // uploadParams.Body = fileStream;
    const path = require('path');
    const fileName = path.basename(file);
    const objectName = folder ? `uploads/${folder}/${fileName}` : `uploads/${fileName}`;


    // Create params for putObject call
    var objectParams = {
        Bucket: bucket,
        Key: objectName,
        Body: fileStream,
        ContentType: getImageMimeType(file),
        ACL: 'public-read'
    };

    const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    // Create object upload promise
    var uploadPromise = s3.upload(objectParams).promise();
    await uploadPromise;
}

/**
 * Return the image MIME Type
 * @param {*} fileName 
 * @returns 
 */
function getImageMimeType(fileName) {
    return `image/${fileName.substr(fileName.lastIndexOf(".") + 1).toLowerCase()}`;
}

module.exports = router;