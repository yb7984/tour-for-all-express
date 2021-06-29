"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const db = require("../db");
const Tour = require("./tour");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    t1,
    p1,
    u2,
    u1,
} = require("./_testCommon");

const { ROLE_USER, ROLE_ADMIN } = require('./role');
const { TOUR_STATUS_PRIVATE, TOUR_STATUS_PUBLIC, TOUR_STATUS_STARTED, TOUR_STATUS_ENDED } = require('./tourStatus');
const TourPlayer = require("./tourPlayer");
const { update } = require("./tourPlayer");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** list */

describe("list", function () {
    test("works", async function () {
        const players = await TourPlayer.list(t1.id);
        expect(players.length).toEqual(1);
        expect(players).toEqual([
            {
                ...p1,
                signupTime: expect.any(Date)
            }
        ]);
    });
});


/************************************** listByPlayer */

describe("listByPlayer", function () {
    test("works", async function () {
        const players = await TourPlayer.listByPlayer('u1');
        expect(players.length).toEqual(1);
        expect(players).toEqual([
            {
                ...p1,
                signupTime: expect.any(Date)
            }
        ]);
    });


    test("works, found nothing for u2", async function () {
        const players = await TourPlayer.listByPlayer('u2');
        expect(players.length).toEqual(0);
        expect(players).toEqual([]);
    });
});




/************************************** insert */

describe("insert", function () {
    test("works", async function () {
        let player = await TourPlayer.insert(t1.id, u2.username);

        expect(player).toEqual(new TourPlayer({
            tourId: t1.id,
            username: u2.username,
            signupTime: expect.any(Date)
        }));

        const found = await db.query("SELECT * FROM tours_players WHERE tour_id = $1 AND username=$2", [t1.id, u2.username]);
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].username).toEqual(u2.username);
    });
});

/************************************** update */

describe("update", function () {

    const updateData = {
        place: 1,
        prize: "$1000"
    };

    test("works", async function () {
        let player = await TourPlayer.update(t1.id, u1.username, updateData);

        expect(player).toEqual({
            ...p1,
            ...updateData,
            signupTime: expect.any(Date)
        });
    });

    test("not found if no such player", async function () {
        try {
            await TourPlayer.update("0", 'u2', updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request if no data", async function () {
        expect.assertions(1);
        try {
            await TourPlayer.update(1, "u2", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});