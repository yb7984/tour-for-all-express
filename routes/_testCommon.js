"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Tour = require("../models/tour");
const TourTemplate = require("../models/tourTemplate.js");
const TourPlayer = require("../models/tourPlayer.js");
const { createToken } = require("../helpers/tokens");
const { ROLE_USER, ROLE_ADMIN } = require("../models/role.js");
const { TOUR_STATUS_PUBLIC, TOUR_STATUS_ENDED, TOUR_STATUS_STARTED, TOUR_STATUS_CANCELED } = require('../models/tourStatus');

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users_tours_follow");
    await db.query("DELETE FROM users_follow");
    await db.query("DELETE FROM tours_players");
    await db.query("DELETE FROM tours_templates");
    await db.query("DELETE FROM tours");
    await db.query("DELETE FROM users");


    await db.query("ALTER SEQUENCE tours_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE tours_templates_id_seq RESTART WITH 1");

    await User.register(new User({
        username: "u1",
        password: 'password1',
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
        role: ROLE_ADMIN,
        isActive: true
    }));

    await User.register(new User({
        username: "u2",
        password: 'password2',
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
        role: ROLE_USER,
        isActive: true
    }));


    await User.register(new User({
        username: "u3",
        password: 'password3',
        firstName: "U3F",
        lastName: "U3L",
        email: "u3@email.com",
        role: ROLE_USER,
        isActive: true
    }));

    const t1 = await Tour.insert(new Tour({
        title: "t-1",
        creator: "u1",
        price: 10,
        entryFee: 2,
        start: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: TOUR_STATUS_PUBLIC,
        isActive: true
    }));
    let tStart = await Tour.insert(new Tour({
        title: "t-start",
        creator: "u2",
        price: 100,
        entryFee: 0,
        start: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: TOUR_STATUS_PUBLIC,
        isActive: true
    }));

    tStart = await Tour.update(tStart, {
        startTime: tStart.start,
        status: TOUR_STATUS_STARTED
    });

    let tEnd = await Tour.insert(new Tour({
        title: "t-end",
        creator: "u1",
        price: 10,
        entryFee: 2,
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: TOUR_STATUS_PUBLIC,
        isActive: true
    }));

    tEnd = await Tour.update(tEnd, {
        startTime: tEnd.start,
        endTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
        status: TOUR_STATUS_ENDED
    });


    let tCancel = await Tour.insert(new Tour({
        title: "t-cancel",
        creator: "u2",
        price: 10,
        entryFee: 2,
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: TOUR_STATUS_PUBLIC,
        isActive: true
    }));
    tCancel = await Tour.update(tCancel, {
        status: TOUR_STATUS_CANCELED
    });

    await User.follow('u1', 'u2');
    await User.followTour('u1', t1.id);

    await TourPlayer.insert(t1.id, 'u1');
    await TourPlayer.insert(tStart.id, 'u2');
    await TourPlayer.insert(tEnd.id, 'u1');

    await TourTemplate.insert(new TourTemplate({
        title: "tt-1",
        description: "tt-description",
        creator: "u1",
        price: 10,
        entryFee: 2,
        isPublic: true
    }));
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}


const u1Token = createToken({ username: "u1", role: ROLE_ADMIN });
const u2Token = createToken({ username: "u2", role: ROLE_USER });
const u3Token = createToken({ username: "u3", role: ROLE_USER });

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token,
    u3Token
};
