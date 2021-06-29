"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

const FIELDS_SELECT = `tour_id AS "tourId" , username, signup_time AS "signupTime", place, prize`;

/** Related functions for tours_players. */

class TourPlayer {
    tourId;
    username;
    signupTime;
    place = 0;
    prize = "";

    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    /**
     * Return the list of players of certain tournament
     * @param {Integer} tourId 
     * @returns [TourPlayer]
     */
    static async list(tourId) {
        const result = await db.query(
            `SELECT ${FIELDS_SELECT} FROM tours_players WHERE tour_id = $1`,
            [tourId]);

        return result.rows.map(row => (new TourPlayer(row)));
    }


    /**
     * Return the list of players of certain tournament
     * @param {Integer} tourId 
     * @returns [TourPlayer]
     */
    static async listByPlayer(username) {
        const result = await db.query(
            `SELECT ${FIELDS_SELECT} FROM tours_players WHERE username = $1`,
            [username]);

        return result.rows.map(row => (new TourPlayer(row)));
    }


    /**
     * Create a new player with data.
     * @param {Integer} tourId
     * @param {String} username
     * @returns TourPlayer
     */
    static async insert(tourId, username) {

        const result = await db.query(
            `INSERT INTO tours_players
                ( tour_id , username) VALUES ($1, $2)
                ON CONFLICT (username , tour_id) 
                DO UPDATE SET tour_id=$1 WHERE tours_players.username=$2 AND tours_players.tour_id=$1
                RETURNING ${FIELDS_SELECT}`,
            [tourId, username],
        );
        if (result.rows.length > 0) {
            return new TourPlayer(result.rows[0]);
        }
        return null;
    }


    /** Update player data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * @param {Integer} tourId
     * @param {String} username
     * @param {Object} data
     * Data can include:
     *         {place, prize}
     *
     * @returns TourPlayer
     *
     * Throws NotFoundError if not found.
     */
    static async update(tourId, username, data) {

        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const tourIdVarIdx = "$" + (values.length + 1);
        const usernameVarIdx = "$" + (values.length + 2);

        const querySql = `UPDATE tours_players SET ${setCols}
                        WHERE tour_id = ${tourIdVarIdx} AND username = ${usernameVarIdx}
                        RETURNING ${FIELDS_SELECT}`;

        const result = await db.query(querySql, [...values, tourId, username]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`No tour: ${tourId}`);
        }

        return new TourPlayer(result.rows[0]);
    }

    /**
     * Delete given player from database; returns undefined.
     * @param {Integer} tourId
     * @param {String} username
     * 
     */
    static async remove(tourId, username) {
        let result = await db.query(
            `DELETE FROM tours_players WHERE tour_id = $1 AND username = $2
            RETURNING tour_id , username`,
            [tourId, username],
        );

        if (!result.rows[0]) throw new NotFoundError(`No player: ${username}`);
    }
}


module.exports = TourPlayer;