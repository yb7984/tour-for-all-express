"use strict";

const db = require("../db");
const { sqlForPartialUpdate, sqlForSearch } = require("../helpers/sql");
const {
    NotFoundError
} = require("../expressError");
const {
    TOUR_STATUS_PRIVATE, TOUR_STATUS_PUBLIC, TOUR_STATUS_STARTED,
    TOUR_STATUS_ENDED, TOUR_STATUS_CANCELED
} = require('./tourStatus');

const { filterPositiveInt } = require("../helpers/utils");
const TourPlayer = require("./tourPlayer");

const FIELDS_SELECT = `id, slug, title, image, guaranteed, stack,
    description, creator, price, entry_fee as "entryFee", start, 
    setting, clock_setting AS "clockSetting", status,
    start_time AS "startTime", end_time AS "endTime", is_active AS "isActive"`;

/** Related functions for tours. */
class Tour {
    id;
    slug;
    title;
    image = "";
    guaranteed = 0;
    stack = 10000;
    description = "";
    creator;
    price = 0;
    entryFee = 0;
    start = null;
    setting = "";
    clockSetting = "";
    status = TOUR_STATUS_PRIVATE;
    startTime = null;
    endTime = null;
    isActive = true;

    players = {};


    get imageUrl() {
        return this.image;
    }

    constructor(obj) {
        obj && Object.assign(this, obj);

        if (typeof this.start === "string") {
            this.start = new Date(this.start);
        }
        if (typeof this.startTime === "string") {
            this.startTime = new Date(this.startTime);
        }
        if (typeof this.endTime === "string") {
            this.endTime = new Date(this.endTime);
        }
    }

    /**
     * Generate a slug
     * @param {Tour} tour 
     * @returns slug
     */
    static async generateSlug(tour) {
        let slug;
        while (slug =
            tour.start.toISOString().substr(0, 10) + "-" +
            tour.title.trim().toLowerCase().replace(/\W/g, '-').substr(0, 30) + "-" +
            (Date.now() % 10000)) {

            // make sure the slug there is no conflict
            const duplicateCheck = await db.query(
                `SELECT slug FROM tours WHERE slug = $1 AND id <> $2`,
                [slug, tour.id]
            );

            if (duplicateCheck.rows.length === 0) {
                break;
            }
        }

        return slug;
    }
    /**s
     * Find tours.
     * @param {Object} params
     * @param {Integer} page
     * @param {Integer} perPage
     * @param {string} listType could be one of these all,private,upcoming,past,runing,canceled
     * @returns {tours:[Tour,...] , total , perPage, page}
     */
    static async find(params = {}, page = 1, perPage = 20, listType = "all") {
        // const username = params["username"] && params["username"];

        const newParams = { ...params };
        delete newParams["username"];

        const searchParams = Object.entries(newParams).map(([key, value]) => {
            switch (key) {
                case "term":
                    return {
                        fields: ["title", "description"],
                        operator: "LIKE",
                        value
                    };
                case "isActive":
                    return {
                        fields: ["is_active"],
                        operator: "=",
                        value
                    };
                case "minPrice":
                    return {
                        fields: ["price"],
                        operator: ">=",
                        value
                    };

                case "maxPrice":
                    return {
                        fields: ["price"],
                        operator: "<=",
                        value
                    };
                case "minGuaranteed":
                    return {
                        fields: ["guaranteed"],
                        operator: ">=",
                        value
                    };
                case "maxGuaranteed":
                    return {
                        fields: ["guaranteed"],
                        operator: "<=",
                        value
                    };
                case "minStart":
                    return {
                        fields: ["start"],
                        operator: ">=",
                        value
                    };

                case "maxStart":
                    return {
                        fields: ["start"],
                        operator: "<=",
                        value
                    };
                default:
                    return {
                        fields: [key],
                        operator: "=",
                        value: value
                    };
            }
        });
        let { wheres, values } = sqlForSearch(searchParams);

        let orderBy = "start DESC";
        let condition = "";

        switch (listType) {
            case "private":
                condition = `"status" = ${TOUR_STATUS_PRIVATE} AND "creator" = '${params["creator"]}'`;
                orderBy = "start";
                break;
            case "upcoming":
                condition = `"status" IN (${TOUR_STATUS_PUBLIC} , ${TOUR_STATUS_STARTED})`;
                orderBy = "start";
                break;
            case "past":
                condition = `"status" = ${TOUR_STATUS_ENDED}`;
                orderBy = "start DESC";
                break;
            case "running":
                condition = `"status" = ${TOUR_STATUS_STARTED}`;
                orderBy = "start ASC";
                break;
            case "canceled":
                condition = `"status" = ${TOUR_STATUS_CANCELED}`;
                orderBy = "start DESC";
                break;
            case "favorite":
                condition = `"id" IN (SELECT "tour_id" FROM users_tours_follow WHERE "username" = '${params["username"]}')`;
                orderBy = "start DESC";
                break;
            case "joined":
                condition = `"id" IN (SELECT "tour_id" FROM tours_players WHERE "username" = '${params["username"]}')`;
                orderBy = "start DESC";
                break;
            default:
                break;
        }

        if (condition.length > 0) {
            wheres = wheres.length > 0 ? `${wheres} AND ${condition}` : condition;
        }

        const resultCount = await db.query(
            `SELECT COUNT(*) AS "count" 
            FROM tours 
            ${wheres.length === 0 ? "" : "WHERE " + wheres}`,
            [
                ...values
            ]);

        const total = parseInt(resultCount.rows[0].count);

        if (total >= perPage * (page - 1)) {
            const result = await db.query(
                `
            SELECT ${FIELDS_SELECT}
            FROM tours 
            ${wheres.length === 0 ? "" : "WHERE " + wheres}
            ORDER BY ${orderBy}
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
                [
                    ...values,
                    perPage,
                    perPage * (page - 1)
                ]
            );

            return {
                tours: result.rows.map(row => (new Tour(row))),
                total,
                perPage,
                page
            };
        }
        return {
            tours: [],
            total,
            perPage,
            page
        };
    }


    /**
     * Given a tour handle, return data about tour.
     * Throws NotFoundError if tour not found.
     * @param {*} handle can be tour id or tour slug
     * @returns Tour
     */
    static async get(handle) {

        let idField = "id";

        if (isNaN(filterPositiveInt(handle))) {
            idField = "slug";
        }

        const res = await db.query(
            `SELECT ${FIELDS_SELECT}
            FROM tours WHERE ${idField} = $1
            `, [handle],
        );

        if (res.rows.length === 0) {
            throw new NotFoundError(`No tour: ${handle}`);
        }
        const tour = new Tour(res.rows[0]);

        const tourPlayers = await TourPlayer.list(tour.id);

        tour.players = {};
        tourPlayers.forEach(player => {
            tour.players[player.username] = player;
        });

        return tour;
    }


    /**
     * Create a new tour with data.
     * @param {Tour} tour
     * @returns Tour
     */
    static async insert(tour) {
        const {
            title,
            image,
            guaranteed,
            stack,
            description,
            creator,
            price,
            entryFee,
            start,
            setting,
            clockSetting,
            status
        } = tour;

        let slug = tour.slug;

        if (!slug || slug.length === 0) {
            slug = await Tour.generateSlug(tour);
        }

        const result = await db.query(
            `INSERT INTO tours
                (
                    slug,
                    title,
                    image,
                    guaranteed,
                    stack,
                    description,
                    creator,
                    price,
                    entry_fee,
                    start,
                    setting,
                    clock_setting,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING ${FIELDS_SELECT}`,
            [
                slug,
                title,
                image,
                guaranteed,
                stack,
                description,
                creator,
                price,
                entryFee,
                start,
                setting,
                clockSetting,
                status || TOUR_STATUS_PRIVATE
            ],
        );

        return new Tour(result.rows[0]);
    }



    /** Update tour data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * @param {Tour} tour
     * @param {Object} data
     * Data can include:
     *         { slug, title, image, guaranteed,stack, description,
                    creator, price, entryFee, start, setting,clockSetting,
                    status,startTime,endTime, isActive,}
     *
     * @returns Tour
     *
     * Throws NotFoundError if not found.
     *
     * Callers of this function must be certain they have validated inputs to this
     * or a serious security risks are opened.
     */

    static async update(tour, data) {
        if (!tour) {
            throw new NotFoundError(`No tour`);
        }

        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                entryFee: "entry_fee",
                clockSetting: "clock_setting",
                startTime: "start_time",
                endTime: "end_time",
                isActive: "is_active",
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE tours 
            SET ${setCols}
            WHERE id = ${idVarIdx} 
            RETURNING ${FIELDS_SELECT}`;

        const result = await db.query(querySql, [...values, tour.id]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`No tour: ${tour.id}`);
        }

        const newTour = new Tour(result.rows[0]);
        const tourPlayers = await TourPlayer.list(newTour.id);

        newTour.players = {};
        tourPlayers.forEach(player => {
            newTour.players[player.username] = player;
        });

        return newTour;
    }

    /**
     * Delete given tour from database; returns undefined.
     * @param {Tour} tour 
     */
    static async remove(tour) {
        if (!tour) {
            throw new NotFoundError(`No tournament`);
        }

        if (Object.keys(tour.players).length === 0 ||
            tour.status === TOUR_STATUS_PRIVATE ||
            tour.status === TOUR_STATUS_CANCELED) {
            // no players yet or not public or canceled, can just delete it

            const result = await db.query(
                `DELETE FROM tours WHERE id = $1 RETURNING id`,
                [tour.id],
            );
            const returnId = result.rows[0];

            return { deleted: tour.id };
        } else {
            // otherwise just disactive it.
            const result = await db.query(
                `UPDATE tours SET is_active=FALSE WHERE id = $1 RETURNING id`,
                [tour.id],
            );
            const returnId = result.rows[0];
            return { deactivated: tour.id };
        }

    }
}

module.exports = Tour;