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
    u2Token
} = require("./_testCommon");
const { ROLE_USER, ROLE_ADMIN } = require("../models/role.js");
const User = require("../models/user.js");

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



/************************************** POST /tours */

describe("POST /tours", function () {

    const newTourData = {
        title: "new tour",
        image: "tour.jpg",
        description: "new tour description",
        guaranteed: 10000,
        price: 100,
        entryFee: 20,
        start: new Date("2021-07-20T14:10:00.000Z"),
        setting: `{level:20}`
    };

    test("works for tours: create", async function () {

        const resp = await request(app)
            .post("/tours")
            .send(newTourData)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            tour: {
                ...(new Tour(newTourData)),
                id: expect.any(Number),
                slug: expect.any(String),
                start: newTourData.start.toISOString(),
                creator: "u1"
            }
        });
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/tours")
            .send(newTourData);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request if missing data", async function () {
        const resp = await request(app)
            .post("/tours")
            .send({
                title: "test"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request if invalid data", async function () {
        const resp = await request(app)
            .post("/tours")
            .send({
                title: "new title",
                start: "not a date"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});


/************************************** GET /tours */

describe("GET /tours", function () {
    test("works for anon", async function () {
        const resp = await request(app)
            .get("/tours");
        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 4,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(4);
    });
    test("works for users", async function () {
        const resp = await request(app)
            .get("/tours")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 4,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(4);
    });

    test("works for tours with conditions", async function () {
        let resp = await request(app)
            .get("/tours?term=end");
        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(1);
        expect(resp.body.tours[0].title).toEqual("t-end");

        resp = await request(app)
            .get("/tours?term=start&isActive=true");

        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(1);
        expect(resp.body.tours[0].title).toEqual("t-start");

        resp = await request(app)
            .get("/tours?term=start&isActive=false");

        expect(resp.body).toEqual({
            tours: [],
            total: 0,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(0);
    });


    test("works for tours listType", async function () {
        let resp = await request(app)
            .get("/tours?listType=upcoming");


        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 2,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(2);
        expect(resp.body.tours[0].title).toEqual("t-start");

        resp = await request(app)
            .get("/tours?listType=past");

        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(1);
        expect(resp.body.tours[0].title).toEqual("t-end");

        resp = await request(app)
            .get("/tours?listType=running");


        expect(resp.body).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(resp.body.tours.length).toEqual(1);
        expect(resp.body.tours[0].title).toEqual("t-start");
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE tours CASCADE");
        const resp = await request(app)
            .get("/tours");
        expect(resp.statusCode).toEqual(500);
    });
});



/************************************** GET /tours/:handle */

describe("GET /tours/:handle", function () {
    test("works for slug", async function () {
        const resp = await request(app)
            .get(`/tours/${t1.slug}`);
        expect(resp.body.tour.title).toEqual(t1.title);
        expect(resp.body.tour.description).toEqual(t1.description);
    });
    test("works for id", async function () {
        const resp = await request(app)
            .get(`/tours/${t1.id}`);
        expect(resp.body.tour.title).toEqual(t1.title);
        expect(resp.body.tour.description).toEqual(t1.description);
    });

    test("not found if tour not found", async function () {
        const resp = await request(app)
            .get(`/tours/00`);
        expect(resp.statusCode).toEqual(404);
    });
});


/************************************** PATCH /tours/:handle */

describe("PATCH /tours/:handle", () => {
    test("works for users login as admin", async function () {
        const resp = await request(app)
            .patch(`/tours/${t1.slug}`)
            .send({
                title: "new title"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body.tour.title).toEqual("new title");
    });


    test("works for users login creator", async function () {
        const resp = await request(app)
            .patch(`/tours/${t2.slug}`)
            .send({
                title: "new title"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body.tour.title).toEqual("new title");
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/tours/1`)
            .send({
                firstName: "New",
            });
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for login not creator", async function () {
        const resp = await request(app)
            .patch(`/tours/${t1.slug}`)
            .send({
                title: "new title"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found if no such tour", async function () {
        const resp = await request(app)
            .patch(`/tours/nope`)
            .send({
                title: "Nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request if invalid data", async function () {
        const resp = await request(app)
            .patch(`/tours/${t1.slug}`)
            .send({
                titleD: "new title"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});



/************************************** DELETE /tours/:handle */

describe("DELETE /tours/:handle", function () {
    test("works for users login as admin", async function () {
        const resp = await request(app)
            .delete(`/tours/4`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: 4 });
    });


    test("works for users login the creator", async function () {
        const resp = await request(app)
            .delete(`/tours/4`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({ deleted: 4 });
    });



    test("works for tour already have players", async function () {
        const resp = await request(app)
            .delete(`/tours/1`)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.body).toEqual({ deactivated: 1 });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/tours/1`);
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for login not the creator", async function () {
        const resp = await request(app)
            .delete(`/tours/1`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found if tour missing", async function () {
        const resp = await request(app)
            .delete(`/tours/nope`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});


/************************************** POST /tours/:handle/follow/:username */

describe("POST /:handle/follow/:username", function () {

    test("works for admin", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/follow/u2`)
            .send({})
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({ follow: t2.id });
    });


    test("works for current user", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/follow/u2`)
            .send({})
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({ follow: t2.id });
    });



    test("unauth for not current user", async function () {

        const resp = await request(app)
            .post(`/tours/${t2.slug}/follow/u1`)
            .send({})
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .post(`/tours/${t2.slug}/follow/u2`)
            .send({});
        expect(resp.statusCode).toEqual(401);
    });
});



/************************************** DELETE /tours/:handle/follow/:username */

describe("DELETE /:handle/follow/:username", function () {

    test("works for admin", async function () {

        await User.followTour('u2', t2.id, true);

        const resp = await request(app)
            .delete(`/tours/${t2.slug}/follow/u2`)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ defollow: t2.id });
    });


    test("works for current user", async function () {

        await User.followTour('u2', t2.id, true);

        const resp = await request(app)
            .delete(`/tours/${t2.slug}/follow/u2`)
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ defollow: t2.id });
    });



    test("unauth for not current user", async function () {
        const resp = await request(app)
            .delete(`/tours/${t2.slug}/follow/u1`)
            .set("authorization", `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/tours/${t2.slug}/follow/u2`)
        expect(resp.statusCode).toEqual(401);
    });
});