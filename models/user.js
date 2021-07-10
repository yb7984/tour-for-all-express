"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate, sqlForSearch } = require("../helpers/sql");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { ROLE_USER } = require("./role");
const { TOUR_STATUS_STARTED, TOUR_STATUS_ENDED } = require("./tourStatus");

const FIELDS_SELECT = `username,first_name AS "firstName", last_name AS "lastName",
    email, phone, image, role, updated, created, is_active AS "isActive"`;

/** Related functions for users. */
class User {
    username;
    password = "";
    firstName = "";
    lastName = "";
    email = "";
    phone = "";
    image = "";
    role = ROLE_USER;
    updated = null;
    created = null;
    isActive = true;

    followers = [];
    followings = [];

    followingTours = [];

    tours = {};

    get imageUrl() {
        return this.image;
    }

    constructor(obj) {
        obj && Object.assign(this, obj);
    }


    /**
     * authenticate user with username, password.
     * Throws UnauthorizedError is user not found or wrong password.
     * @param {String} username 
     * @param {String} password 
     * @returns User { username, first_name, last_name, email, role }
     */
    static async authenticate(username, password) {
        // try to find the user first
        const result = await db.query(
            `SELECT ${FIELDS_SELECT} , password FROM users
            WHERE username = $1 AND is_active = TRUE`,
            [username],
        );

        const user = new User(result.rows[0]);

        if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid === true) {
                // delete user.password;
                user.password = "";
                return user;
            }
        }

        throw new UnauthorizedError("Invalid username/password");
    }

    /**
     * Register user with data.
     * Throws BadRequestError on duplicates.
     * @param {User{ username, password, firstName, lastName, email, role }} user
     * @returns User{ username, firstName, lastName, email, role }
     */
    static async register(user) {
        const { username, password, firstName, lastName, email, role } = user;
        const duplicateCheck = await db.query(
            `SELECT username FROM users WHERE username = $1`,
            [username],
        );

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate username: ${username}`);
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users (
                    username,
                    password,
                    first_name,
                    last_name,
                    email,
                    role)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING ${FIELDS_SELECT}`,
            [
                username,
                hashedPassword,
                firstName,
                lastName,
                email,
                role,
            ],
        );

        return new User(result.rows[0]);
    }


    /**s
     * Find users.
     * @param {Object} params
     * @param {Integer} page
     * @param {Integer} perPage
     * @returns {users:[User,...] , total , perPage, page}
     */
    static async find(params = {}, page = 1, perPage = 20) {

        const searchParams = Object.entries(params).map(([key, value]) => {
            switch (key) {
                case "term":
                    return {
                        fields: ["username", "first_name", "last_name", "email", "phone"],
                        operator: "LIKE",
                        value: value
                    };
                case "isActive":
                    return {
                        fields: ["is_active"],
                        operator: "=",
                        value: value
                    };
                default:
                    return {
                        fields: [key],
                        operator: "=",
                        value: value
                    };
            }
        });
        const { wheres, values } = sqlForSearch(searchParams);

        const resultCount = await db.query(
            `SELECT COUNT(*) AS "count" 
            FROM users 
            ${wheres.length === 0 ? "" : "WHERE " + wheres}`,
            [
                ...values
            ]);

        const total = parseInt(resultCount.rows[0].count);

        if (total >= perPage * (page - 1)) {
            const result = await db.query(
                `SELECT ${FIELDS_SELECT} 
                FROM users 
                ${wheres.length === 0 ? "" : "WHERE " + wheres}
                ORDER BY username
                LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
                [
                    ...values,
                    perPage,
                    perPage * (page - 1)
                ]
            );

            return {
                users: result.rows.map(row => (new User(row))),
                total,
                perPage,
                page
            };
        }


        return {
            users: [],
            total,
            perPage,
            page
        };
    }


    /**
     * Given a username, return data about user.
     * Throws NotFoundError if user not found.
     * @param {*} username 
     * @returns User
     */
    static async get(username) {
        const userRes = await db.query(
            `SELECT ${FIELDS_SELECT} FROM users WHERE username = $1`,
            [username],
        );

        if (userRes.rows.length === 0) {
            throw new NotFoundError(`No user: ${username}`);
        }

        const user = new User(userRes.rows[0]);

        await User.setFollowings(user);
        await User.setFollowers(user);
        await User.setFollowingTours(user);

        return user;
    }

    /**
     * Get the following list and set the followings property of the user.
     * @param {User} user 
     */
    static async setFollowings(user) {
        const res = await db.query(
            `SELECT following FROM users_follow WHERE username = $1`,
            [user.username]);

        user.followings.length = 0;
        res.rows.forEach(row => {
            user.followings.push(row.following);
        });
    }


    /**
     * Get the following tours list and set the followingTours property of the user.
     * @param {User} user 
     */
    static async setFollowingTours(user) {
        const res = await db.query(
            `SELECT tour_id FROM users_tours_follow WHERE username = $1`,
            [user.username]);

        user.followingTours.length = 0;
        res.rows.forEach(row => {
            user.followingTours.push(row.tour_id);
        });
    }


    /**
     * Get the follower list and set the followers property of the user.
     * @param {User} user 
     */
    static async setFollowers(user) {
        const res = await db.query(
            `SELECT username FROM users_follow WHERE following = $1`,
            [user.username]);

        user.followers.length = 0;
        res.rows.forEach(row => {
            user.followers.push(row.username);
        });
    }

    /** Update user data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * @param {String} username
     * @param {Object} data
     * Data can include:
     *         { firstName, lastName, password, email, phone , image , role , isActive}
     *
     * @returns User
     *
     * Throws NotFoundError if not found.
     *
     * WARNING: this function can set a new password or make a user an admin.
     * Callers of this function must be certain they have validated inputs to this
     * or a serious security risks are opened.
     */

    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                firstName: "first_name",
                lastName: "last_name",
                isActive: "is_active",
            });
        const usernameVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE users 
            SET ${setCols} , 
            updated = NOW()
            WHERE username = ${usernameVarIdx} 
            RETURNING ${FIELDS_SELECT}`;

        const result = await db.query(querySql, [...values, username]);

        if (result.rows.length === 0) {
            throw new NotFoundError(`No user: ${username}`);
        }

        const user = new User(result.rows[0]);

        await User.setFollowings(user);
        await User.setFollowers(user);
        await User.setFollowingTours(user);

        return user;
    }


    /**
     * Follow or Defollow another user
     * @param {String} username
     * @param {String} following 
     * @param {Boolean} isFollow 
     * @returns following
     */
    static async follow(username, following, isFollow = true) {

        if (isFollow) {
            const result = await db.query(
                `INSERT INTO users_follow (username , following) VALUES ($1 , $2)
                ON CONFLICT (username , following) DO NOTHING
                RETURNING username , following` ,
                [username, following]);

            return following;
        } else {
            const result = await db.query(`DELETE FROM users_follow WHERE username=$1 AND following=$2`,
                [username, following]);
        }
    }


    /**
     * Follow or Defollow a tournament
     * @param {String} username
     * @param {Integer} tourId 
     * @param {Boolean} isFollow 
     * @returns tourId
     */
    static async followTour(username, tourId, isFollow = true) {

        if (isFollow) {
            const result = await db.query(
                `INSERT INTO users_tours_follow (username , tour_id) VALUES ($1 , $2)
                ON CONFLICT (username , tour_id) DO NOTHING
                RETURNING username , tour_id AS tourId` ,
                [username, tourId]);

            return tourId;
        } else {
            const result = await db.query(`DELETE FROM users_tours_follow WHERE username=$1 AND tour_id=$2`,
                [username, tourId]);
        }
    }

    /**
     * Delete given user from database; returns undefined.
     * @param {String} username 
     */
    static async remove(username) {
        let toDelete = true;

        //check the tours table, no running tours or ended tours
        const resultCreator = await db.query(
            `SELECT COUNT(*) AS "count" FROM tours WHERE creator = $1 AND status NOT IN ($2, $3)`,
            [username, TOUR_STATUS_STARTED, TOUR_STATUS_ENDED]
        );

        if (resultCreator.rows[0].count > 0) {
            toDelete = false;
        }

        if (toDelete) {
            //check the players table, no running tours or ended tours 
            const resultPlayer = await db.query(
                `SELECT COUNT(*) AS "count" FROM 
                    tours_players as "a" INNER JOIN tours as "b" ON a.tour_id=b.id 
                WHERE a.username = $1 AND b.status NOT IN ($2, $3)`,
                [username, TOUR_STATUS_STARTED, TOUR_STATUS_ENDED]
            );

            if (resultPlayer.rows[0].count > 0) {
                toDelete = false;
            }
        }

        if (toDelete) {
            const result = await db.query(
                `DELETE FROM users WHERE username = $1
                RETURNING username`,
                [username],
            );
            const user = result.rows[0];

            if (!user) throw new NotFoundError(`No user: ${username}`);

            return { deleted: username };
        } else {
            // just deactivate the account
            const result = await db.query(
                `UPDATE users SET is_active = FALSE WHERE username = $1
                RETURNING username`,
                [username],
            );
            const user = result.rows[0];

            if (!user) throw new NotFoundError(`No user: ${username}`);

            return { deactivated: username };
        }
    }
}


module.exports = User;
