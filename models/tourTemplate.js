"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    NotFoundError
} = require("../expressError");

const FIELDS_SELECT = `id, title, image, guaranteed,
    description, creator, price, entry_fee as "entryFee",  
    setting, is_public AS "isPublic"`;

/** Related functions for tours_templates. */
class TourTemplate {
    id;
    title;
    image = "";
    guaranteed = 0;
    description = "";
    creator;
    price = 0;
    entryFee = 0;
    setting = "";
    isPublic = false;

    get imageUrl() {
        return this.image;
    }

    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    /**s
     * Find tour templates. 
     * Will return all self created and public templates
     * @param {String} username
     * @param {Object} params
     * @param {Integer} page
     * @param {Integer} perPage
     * @returns Array of TourTemplates [TourTemplate, ...]
     */
    static async find(username, params = {}, page = 1, perPage = 20) {
        const result = await db.query(
            `
            SELECT ${FIELDS_SELECT}
            FROM tours_templates 
            WHERE creator = $3 OR is_public = TRUE
            ORDER BY id DESC
            LIMIT $1 OFFSET $2`,
            [
                perPage,
                perPage * (page - 1),
                username
            ]
        );

        return result.rows.map(row => (new TourTemplate(row)));
    }


    /**
     * Given a tour template id, return data about tour template.
     * Throws NotFoundError if tour template not found.
     * @param {int} id can be tour template id
     * @returns TourTemplate
     */
    static async get(id) {
        const res = await db.query(
            `SELECT ${FIELDS_SELECT}
            FROM tours_templates WHERE id = $1
            `, [id],
        );

        if (res.rows.length === 0) {
            throw new NotFoundError(`No tour template: ${id}`);
        }
        return new TourTemplate(res.rows[0]);
    }


    /**
     * Create a new tour template with data.
     * @param {TourTemplate} template
     * @returns TourTemplate
     */
    static async insert(template) {

        const {
            title,
            image,
            guaranteed,
            description,
            creator,
            price,
            entryFee,
            setting,
            isPublic
        } = template;


        const result = await db.query(
            `INSERT INTO tours_templates
                (
                    title,
                    image,
                    guaranteed,
                    description,
                    creator,
                    price,
                    entry_fee,
                    setting,
                    is_public
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING ${FIELDS_SELECT}`,
            [
                title,
                image,
                guaranteed,
                description,
                creator,
                price,
                entryFee,
                setting,
                isPublic
            ],
        );

        return new TourTemplate(result.rows[0]);
    }



    /** Update tour template data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * @param {Integer} id
     * @param {Object} data
     * Data can include:
     *         { title, image, guaranteed, description,
                    creator, price, entryFee, setting, isPublic}
     *
     * @returns Tour
     *
     * Throws NotFoundError if not found.
     *
     * Callers of this function must be certain they have validated inputs to this
     * or a serious security risks are opened.
     */

    static async update(id, data) {

        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                entryFee: "entry_fee",
                isPublic: "is_public",
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE tours_templates
            SET ${setCols}
            WHERE id = ${idVarIdx} 
            RETURNING ${FIELDS_SELECT}`;

        const result = await db.query(querySql, [...values, id]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`No tour template: ${id}`);
        }

        return new TourTemplate(result.rows[0]);
    }

    /**
     * Delete given tour template from database; returns undefined.
     * @param {Integer} id 
     */
    static async remove(id) {
        let result = await db.query(
            `DELETE FROM tours_templates WHERE id = $1 RETURNING id`,
            [id],
        );
        const returnId = result.rows[0];

        if (!returnId) throw new NotFoundError(`No tour template: ${id}`);
    }
}

module.exports = TourTemplate;