"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdminLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userSearchSchema = require("../schemas/userSearch.json");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }    => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *    {user: User, token }
 *
 * Authorization required: login as admin
 **/

router.post("/", ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/** POST /    => { following : username } or {}
 *
 * Follow or Defollow a user
 *
 * Authorization required: login
 **/

router.post("/:username/:follow", ensureLoggedIn, async function (req, res, next) {
    try {
        if (req.params.follow !== "follow" &&
            req.params.follow != "defollow") {
            throw new BadRequestError("error");
        }

        const result = await User.follow(
            res.locals.user.username,
            req.params.username,
            req.params.follow === "follow");

        return req.params.follow === "follow" ?
            res.status(201).json({ following: result }) :
            res.status(200).json({});
    } catch (err) {
        return next(err);
    }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login as admin
 **/

router.get("/", ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.query, userSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { page, perPage, ...params } = req.query;

        const users = await User.find(
            params,
            page || 1,
            perPage || 20);
        return res.json(users);
    } catch (err) {
        return next(err);
    }
});


/** GET /[username] => { user }
 *
 * Returns User
 *
 * Authorization required: Current User or Admin
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *     { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, role }
 *
 * Authorization required: login as admin or current user
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});


/** DELETE /[username]    =>    { deleted: username }
 *
 * Authorization required: login as admin or current user
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const result = await User.remove(req.params.username);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
