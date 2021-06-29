"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const Tour = require("../models/tour");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token, 
    u3Token
} = require("./_testCommon");
const { ROLE_USER, ROLE_ADMIN } = require("../models/role.js");
const User = require("../models/user.js");
const TourPlayer = require("../models/tourPlayer.js");

let t1;
let t2;

beforeAll(commonBeforeAll);
beforeEach(async () => {
    await commonBeforeEach();
    t1 = await Tour.get(1);
    t2 = await Tour.get(2);
});
afterEach(commonAfterEach);
afterAll(commonAfterAll);




/************************************** POST /tours/:handle/players/:username */

describe("POST /:handle/players/:username", function () {

    test("works for admin", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/players/u2`)
            .send({})
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            player: new TourPlayer({
                username: "u2",
                tourId: t2.id,
                signupTime: expect.any(String)
            })
        });
    });


    test("works for current user", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/players/u2`)
            .send({})
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            player: new TourPlayer({
                username: "u2",
                tourId: t2.id,
                signupTime: expect.any(String)
            })
        });
    });



    test("unauth for not current user", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/players/u1`)
            .send({})
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .post(`/tours/${t2.slug}/players/u2`)
            .send({});
        expect(resp.statusCode).toEqual(401);
    });
});


/************************************** PATCH /tours/:handle/players/:username */

describe("PATCH /:handle/players/:username", function () {

    test("works for admin", async function () {

        const resp = await request(app)
            .patch(`/tours/${t2.slug}/players/u2`)
            .send({
                prize: "20",
                place: 1
            })
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            player: new TourPlayer({
                username: "u2",
                tourId: t2.id,
                signupTime: expect.any(String),
                prize: "20",
                place: 1
            })
        });
    });


    test("works for creator", async function () {

        const resp = await request(app)
            .patch(`/tours/${t2.slug}/players/u2`)
            .send({
                prize: "20",
                place: 1
            })
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            player: new TourPlayer({
                username: "u2",
                tourId: t2.id,
                signupTime: expect.any(String),
                prize: "20",
                place: 1
            })
        });
    });



    test("unauth for not creator or admin", async function () {

        const resp = await request(app)
            .patch(`/tours/${t2.slug}/players/u1`)
            .send({ place: 1 })
            .set("authorization", `Bearer ${u3Token}`);

        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/tours/${t2.slug}/players/u2`)
            .send({ place: 1 })
        expect(resp.statusCode).toEqual(401);
    });
});



/************************************** DELETE /tours/:handle/players/:username */

describe("DELETE /:handle/players/:username", function () {

    test("works for admin", async function () {

        await User.followTour('u2', t2.id, true);

        const resp = await request(app)
            .delete(`/tours/${t2.slug}/players/u2`)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ deleted: "u2" });
    });


    test("works for current user", async function () {

        await User.followTour('u2', t2.id, true);

        const resp = await request(app)
            .delete(`/tours/${t2.slug}/players/u2`)
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ deleted: "u2" });
    });



    test("unauth for not current user", async function () {
        const resp = await request(app)
            .delete(`/tours/${t2.slug}/players/u1`)
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/tours/${t2.slug}/players/u2`)
        expect(resp.statusCode).toEqual(401);
    });
});