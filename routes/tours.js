"use strict";

/** Routes for tours. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdminLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const Tour = require("../models/tour");
const tourSearchSchema = require("../schemas/tourSearch.json");
const tourNewSchema = require("../schemas/tourNew.json");
const tourUpdateSchema = require("../schemas/tourUpdate.json");
const { ensureAdminOrCreator } = require('./helper');

const router = express.Router();


/** POST / { tour }    => { tour }
 *
 * Adds a new tour.
 *
 * This returns the newly created tour:
 *    {tour: Tour}
 *
 * Authorization required: login
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, tourNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const tour = await Tour.insert(new Tour({
            ...req.body,
            creator: res.locals.user.username
        }));
        return res.status(201).json({ tour });
    } catch (err) {
        return next(err);
    }
});



/** GET / => { tours: [ Tour, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: none
 **/

router.get("/", async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.query, tourSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const { page, perPage, listType, ...params } = req.query;
        const tours = await Tour.find(
            params,
            page || 1,
            perPage || 20,
            listType || "all");
        return res.json(tours);
    } catch (err) {
        return next(err);
    }
});


/** GET /[handle] => { tour }
 *
 * Returns Tour
 *
 * Authorization required: none
 **/

router.get("/:handle", async function (req, res, next) {
    try {
        const tour = await Tour.get(req.params.handle);
        return res.json({ tour });
    } catch (err) {
        return next(err);
    }
});


/** PATCH /[handle] { data } => Tour
 *
 * Data can include:
 *     { slug, title, image, guaranteed, description,
                    creator, price, entryFee, start, setting,clockSetting,
                    status,startTime,endTime, isActive,}
 *
 * Returns Tour
 *
 * Authorization required: login as admin or creator
 **/

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, tourUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        let tour = await ensureAdminOrCreator(req.params.handle, res);

        tour = await Tour.update(tour, req.body);
        return res.json({ tour });
    } catch (err) {
        return next(err);
    }
});


/** DELETE /[handle]    =>    { deleted: handle }
 *
 * Authorization required: login as admin or creator
 **/

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
    try {
        const tour = await ensureAdminOrCreator(req.params.handle, res);

        const result = await Tour.remove(tour);

        return res.json(result);
    } catch (err) {
        return next(err);
    }
});


/** POST /[handle]/follow/[username]    =>    TourPlayer
 * Follow a tour
 * Authorization required: login as admin or current user
 **/

router.post("/:handle/follow/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const tour = await Tour.get(req.params.handle);

        const result = await User.followTour(req.params.username, tour.id, true);

        return res.status(201).json({ follow: tour.id });
    } catch (err) {
        return next(err);
    }
});


/** DELETE /[handle]/follow/[username]    =>    {deleted:username}
 * Defollow a tour
 * Authorization required: login as admin or current user
 **/

router.delete("/:handle/follow/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const tour = await Tour.get(req.params.handle);

        const result = await User.followTour(req.params.username, tour.id, false);

        return res.json({ defollow: tour.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;