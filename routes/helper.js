"use strict";


const Tour = require("../models/tour");
const { NotFoundError, UnauthorizedError } = require("../expressError");
const { ROLE_ADMIN } = require("../models/role");

/** Helper functions for routes */


/**
 * Ensure the login user is admin or tour creator
 * Otherwise throw unauthorized error
 * If can not find the tour, throw not found error.
 * @param {*} handle Can be id or slug
 * @param {*} res 
 * @returns Tour
 */
async function ensureAdminOrCreator(handle, res) {
    const tour = await Tour.get(handle);

    if (!tour) {
        throw new NotFoundError(`Not found tour:${req.params.handle}`);
    }
    const user = res.locals.user;
    if (!user ||
        (user.role !== ROLE_ADMIN && tour.creator !== user.username)) {
        //not admin, not the creator
        throw new UnauthorizedError();

    }

    return tour;
}

module.exports = {
    ensureAdminOrCreator
};