"use strict";

/** Express app for tour-for-all. */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const toursRoutes = require("./routes/tours");
const tourPlayersRoutes = require("./routes/tourPlayers");
const filesRoutes = require("./routes/files");

const morgan = require("morgan");
const fileUpload = require("express-fileupload");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use(fileUpload());

app.use("/uploads", express.static('uploads'));

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/tours", tourPlayersRoutes);
app.use("/tours", toursRoutes);
app.use("/files" , filesRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
    return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;

    return res.status(status).json({
        error: { message, status },
    });
});

module.exports = app;
