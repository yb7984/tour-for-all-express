"use strict";

const {
    NotFoundError,
    BadRequestError,
} = require("../expressError");
const db = require("../db");
const TourTemplate = require("./tourTemplate");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    t1,tt1,
    p1,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);



/************************************** find */

describe("find", function () {
    test("works", async function () {
        const list = await TourTemplate.find('u1');
        expect(list.length).toEqual(1);
        expect(list).toEqual([
            tt1,
        ]);
    });
});



/************************************** get */

describe("get", function () {
    test("works", async function () {
        let template = await TourTemplate.get(1);

        expect(template).toEqual(tt1);
    });

    test("not found if no such template", async function () {
        try {
            let template = await TourTemplate.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});



/************************************** insert */

describe("insert", function () {
    const newTemplate = new TourTemplate(
        {
            title: "t-new",
            description: "t-new-description",
            image: "tour.jpg",
            guaranteed: 10000,
            creator: "u1",
            price: 100,
            entryFee: 20,
            setting: "{level:20}"
        });

    test("works", async function () {
        let template = await TourTemplate.insert(newTemplate);

        newTemplate.id = template.id;
        expect(template).toEqual(newTemplate);

        const found = await db.query("SELECT * FROM tours_templates WHERE id = $1", [template.id]);
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].title).toEqual(newTemplate.title);
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
        setting: "{level:20}"
    };

    test("works", async function () {
        let template = await TourTemplate.update(tt1.id, updateData);

        expect(template).toEqual({
            ...tt1,
            ...updateData
        });
    });

    test("not found if no such template", async function () {
        try {
            await TourTemplate.update("-1", {
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
            await TourTemplate.update(1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});


/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await TourTemplate.remove(tt1.id);

        const res = await db.query(
            "SELECT * FROM tours_templates WHERE id=$1", [tt1.id]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such template", async function () {
        try {
            await TourTemplate.remove(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
