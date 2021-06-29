"use strict";

/** Routes for tourPlayers. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdminLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Tour = require("../models/tour");
const tourPlayerUpdateSchema = require("../schemas/tourPlayerUpdate.json");
const TourPlayer = require("../models/tourPlayer");
const { ensureAdminOrCreator } = require('./helper');

const router = express.Router();

/** POST /[handle]/players/[username]    =>    TourPlayer
 * Attend a tour
 * Authorization required: login as admin or current user
 **/

router.post("/:handle/players/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const tour = await Tour.get(req.params.handle);

        const result = await TourPlayer.insert(tour.id, req.params.username);

        return res.status(201).json({ player: result });
    } catch (err) {
        console.log(err)
        return next(err);
    }
});


/** PATCH /[handle]/players/[username]   =>    TourPlayer
 *  Update a player
 * Authorization required: login as admin or creator
 **/

router.patch("/:handle/players/:username", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, tourPlayerUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const tour = await ensureAdminOrCreator(req.params.handle, res);

        const tourPlayer = await TourPlayer.update(tour.id, req.params.username, req.body);

        return res.json({ player: tourPlayer });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]/players/[username]    =>    {deleted:username}
 * Delete a tour
 * Authorization required: login as admin or current user
 **/

router.delete("/:handle/players/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const tour = await Tour.get(req.params.handle);

        const result = await TourPlayer.remove(tour.id, req.params.username);

        return res.json({ deleted: req.params.username });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;