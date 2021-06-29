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
} = require("./_testCommon");

const { ROLE_USER, ROLE_ADMIN } = require('./role');
const { TOUR_STATUS_PRIVATE, TOUR_STATUS_PUBLIC, TOUR_STATUS_STARTED, TOUR_STATUS_ENDED } = require('./tourStatus');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** generateSlug */

describe("generateSlug", function () {
    test("works", async function () {
        t1.start = new Date('2021-07-20');
        const slug = await Tour.generateSlug(t1);
        expect(slug.startsWith("2021-07-20-t-1-")).toEqual(true);
    });
});



/************************************** find */

describe("find", function () {
    test("works", async function () {
        const tours = await Tour.find();
        expect(tours).toEqual({
            tours: expect.any(Array),
            total: 4,
            perPage: 20,
            page: 1
        });
        expect(tours.tours.length).toEqual(4);
        expect(tours.tours[3]).toEqual({
            ...t1,
            start: expect.any(Date)
        });
    });


    test("works with condition", async function () {
        const tours = await Tour.find({
            "term": "t-1"
        });
        expect(tours).toEqual({
            tours: [
                {
                    ...t1,
                    start: expect.any(Date)
                },
            ],
            total: 1,
            perPage: 20,
            page: 1
        });
    });

    test("works with upcoming", async function () {
        const tours = await Tour.find({}, 1, 20, "upcoming");
        expect(tours).toEqual({
            tours: expect.any(Array),
            total: 2,
            perPage: 20,
            page: 1
        });
        expect(tours.tours.length).toEqual(2);
        expect(tours.tours[1]).toEqual(
            {
                ...t1,
                start: expect.any(Date)
            }
        );
    });

    test("works with past", async function () {
        const tours = await Tour.find({}, 1, 20, "past");

        expect(tours).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(tours.tours.length).toEqual(1);
        expect(tours.tours[0].title).toEqual("t-end");
    });


    test("works with running", async function () {
        const tours = await Tour.find({}, 1, 20, "running");
        expect(tours).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(tours.tours.length).toEqual(1);
        expect(tours.tours[0].title).toEqual("t-start");
    });


    test("works with canceled", async function () {
        const tours = await Tour.find({}, 1, 20, "canceled");
        expect(tours).toEqual({
            tours: expect.any(Array),
            total: 1,
            perPage: 20,
            page: 1
        });
        expect(tours.tours.length).toEqual(1);
        expect(tours.tours[0].title).toEqual("t-cancel");
    });

    test("works with condition not found", async function () {
        const tours = await Tour.find({
            "term": "none"
        });
        expect(tours).toEqual({
            tours: [],
            total: 0,
            perPage: 20,
            page: 1
        });
    });
});



/************************************** get */

describe("get", function () {
    test("works with id", async function () {
        let tour = await Tour.get(1);

        expect(tour).toEqual(
            {
                ...t1,
                description: "t-description",
                start: expect.any(Date),
                players: {
                    'u1': {
                        ...p1,
                        signupTime: expect.any(Date)
                    }
                }
            }
        );
    });

    test("works with slug", async function () {
        let tour = await Tour.get("t-1");

        expect(tour).toEqual(
            {
                ...t1,
                description: "t-description",
                start: expect.any(Date),
                players: {
                    'u1': {
                        ...p1,
                        signupTime: expect.any(Date)
                    }
                }
            }
        );
    });

    test("not found if no such tour", async function () {
        try {
            let tour = await Tour.get("t-noop");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});



/************************************** insert */

describe("insert", function () {
    const newTour = new Tour(
        {
            title: "t-new",
            description: "t-new-description",
            image: "tour.jpg",
            guaranteed: 10000,
            creator: "u1",
            price: 100,
            entryFee: 20,
            start: new Date("2021-07-20T14:10:00.000Z"),
            setting: "{level:20}",
            clockSetting: "{bg:red}"
        });

    test("works", async function () {
        let tour = await Tour.insert(newTour);

        newTour.id = tour.id;
        newTour.slug = tour.slug;
        expect(tour).toEqual(newTour);

        const found = await db.query("SELECT * FROM tours WHERE id = $1", [tour.id]);
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].title).toEqual(newTour.title);
    });
});

/************************************** update */

describe("update", function () {

    const updateData = {
        title: "t-new",
        description: "t-new-description",
        image: "tour.jpg",
        guaranteed: 10000,
        creator: "u1",
        price: 100,
        entryFee: 20,
        start: new Date("2021-07-21T14:10:00.000Z"),
        setting: "{level:20}",
        clockSetting: "{bg:red}"
    };

    // updateData.slug = await Tour.generateSlug(updateData);

    test("works", async function () {
        let tour = await Tour.update(t1, updateData);

        expect(tour).toEqual({
            ...t1,
            ...updateData
        });
    });

    test("not found if no such tour", async function () {
        try {
            await Tour.update(null, {
                title: "New"
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request if no data", async function () {
        expect.assertions(1);
        try {
            await Tour.update(t1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});


/************************************** remove */

describe("remove", function () {
    test("work without attended players", async function () {
        const newTour = await Tour.insert(t1);

        let res = await db.query(
            "SELECT * FROM tours WHERE id=$1", [newTour.id]);

        expect(res.rows.length).toEqual(1);

        let result = await Tour.remove(newTour);

        expect(result).toEqual({ deleted: newTour.id });

        res = await db.query(
            "SELECT * FROM tours WHERE id=$1", [newTour.id]);
        expect(res.rows.length).toEqual(0);
    });

    test("works with attended players", async function () {
        try {
            let t = await Tour.get(1);
            let result = await Tour.remove(t);
            expect(result).toEqual({ deactivated: t.id });
        } catch (err) {
            expect(err instanceof Error).toBeTruthy();
        }
    });

    test("not found if no such tour", async function () {
        try {
            await Tour.remove(null);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
