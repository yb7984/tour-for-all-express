"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1,
    u2
} = require("./_testCommon");

const { ROLE_USER, ROLE_ADMIN } = require('./role');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** authenticate */

describe("authenticate", function () {
    test("works", async function () {
        const user = await User.authenticate("u1", "password1");
        expect(user).toEqual({
            ...u1,
            created: expect.any(Date),
            updated: expect.any(Date)
        });
    });

    test("unauth if no such user", async function () {
        try {
            await User.authenticate("nope", "password");
            fail();
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });

    test("unauth if wrong password", async function () {
        try {
            await User.authenticate("c1", "wrong");
            fail();
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });
});

/************************************** register */

describe("register", function () {
    const newUser = new User({
        username: "new",
        firstName: "Test",
        lastName: "Tester",
        email: "test@test.com",
        role: ROLE_USER
    });

    test("works", async function () {
        let user = await User.register({
            ...newUser,
            password: "password",
        });
        expect(user).toEqual({
            ...newUser,
            created: expect.any(Date),
            updated: expect.any(Date)
        });

        const found = await db.query("SELECT * FROM users WHERE username = 'new'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].role).toEqual(ROLE_USER);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    });

    test("works: adds admin", async function () {
        let user = await User.register({
            ...newUser,
            password: "password",
            role: ROLE_ADMIN,
        });
        expect(user).toEqual({
            ...newUser,
            role: ROLE_ADMIN,
            created: expect.any(Date),
            updated: expect.any(Date)
        });
        const found = await db.query("SELECT * FROM users WHERE username = 'new'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].role).toEqual(ROLE_ADMIN);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    });

    test("bad request with dup data", async function () {
        try {
            await User.register({
                ...newUser,
                password: "password",
            });
            await User.register({
                ...newUser,
                password: "password",
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});



/************************************** find */

describe("find", function () {
    test("works", async function () {
        const users = await User.find();
        expect(users).toEqual({
            users: [
                {
                    ...u1,
                    created: expect.any(Date),
                    updated: expect.any(Date)
                },
                {
                    ...u2,
                    created: expect.any(Date),
                    updated: expect.any(Date)
                }
            ],
            total: 2,
            perPage: 20,
            page: 1
        });
    });
    test("works with conditions", async function () {
        const users = await User.find({
            "term": "u1"
        });
        expect(users).toEqual({
            users: [
                {
                    ...u1,
                    created: expect.any(Date),
                    updated: expect.any(Date)
                }
            ],
            total: 1,
            perPage: 20,
            page: 1
        });
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let user = await User.get("u1");

        expect(user).toEqual({
            ...u1,
            followings: ['u2'],
            followers: [],
            followingTours: [1],
            created: expect.any(Date),
            updated: expect.any(Date)
        });
    });

    test("not found if no such user", async function () {
        try {
            await User.get("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        firstName: "NewF",
        lastName: "NewF",
        email: "new@email.com",
        role: ROLE_ADMIN,
    };

    test("works", async function () {
        let user = await User.update("u1", updateData);

        expect(user).toEqual({
            ...u1,
            ...updateData,
            created: expect.any(Date),
            updated: expect.any(Date)
        });
    });

    test("works: set password", async function () {
        let user = await User.update("u1", {
            password: "new",
        });
        expect(user).toEqual({
            ...u1,
            created: expect.any(Date),
            updated: expect.any(Date)
        });
        const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    });

    test("not found if no such user", async function () {
        try {
            await User.update("nope", {
                firstName: "test",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request if no data", async function () {
        expect.assertions(1);
        try {
            await User.update("c1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** follow */
describe("follow", function () {
    test("works with follow", async function () {
        let result = await User.follow('u2', 'u1', true);

        expect(result).toEqual('u1');

        let res = await db.query('SELECT username, following FROM users_follow WHERE username = $1 AND following = $2',
            ['u2', 'u1']);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0]).toEqual({
            username: 'u2',
            following: 'u1'
        });
    });


    test("works with follow when already follow", async function () {
        let result = await User.follow('u1', 'u2', true);

        expect(result).toEqual('u2');

        let res = await db.query('SELECT username, following FROM users_follow WHERE username = $1 AND following = $2',
            ['u1', 'u2']);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0]).toEqual({
            username: 'u1',
            following: 'u2'
        });
    });


    test("works with defollow", async function () {
        let result = await User.follow('u1', 'u2', false);

        expect(result).toEqual(undefined);

        let res = await db.query('SELECT username, following FROM users_follow WHERE username = $1 AND following = $2',
            ['u1', 'u2']);

        expect(res.rows.length).toBe(0);
    });

    test("not found if no such user", async function () {
        try {
            await User.follow('u1', 'noop', true);
            fail();
        } catch (err) {
            expect(err instanceof Error).toBeTruthy();
        }
    });
});


/************************************** followTour */
describe("followTour", function () {
    test("works with follow", async function () {
        let result = await User.followTour('u2', 1, true);

        expect(result).toEqual(1);

        let res = await db.query('SELECT username, tour_id FROM users_tours_follow WHERE username = $1 AND tour_id = $2',
            ['u2', 1]);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0]).toEqual({
            username: 'u2',
            tour_id: 1
        });
    });


    test("works with follow when already follow", async function () {
        let result = await User.followTour('u1', 1, true);

        expect(result).toEqual(1);

        let res = await db.query('SELECT username, tour_id FROM users_tours_follow WHERE username = $1 AND tour_id = $2',
            ['u1', 1]);

        expect(res.rows.length).toBe(1);
        expect(res.rows[0]).toEqual({
            username: 'u1',
            tour_id: 1
        });
    });


    test("works with defollow", async function () {
        let result = await User.followTour('u1', 1, false);

        expect(result).toEqual(undefined);

        let res = await db.query('SELECT username, tour_id FROM users_tours_follow WHERE username = $1 AND tour_id = $2',
            ['u1', 1]);

        expect(res.rows.length).toBe(0);
    });

    test("not found if no such tour_id", async function () {
        try {
            await User.followTour('u1', -1, true);
            fail();
        } catch (err) {
            expect(err instanceof Error).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works without created tours", async function () {
        const result = await User.remove("u2");

        expect(result).toEqual({ deleted: "u2" });

        const res = await db.query(
            "SELECT * FROM users WHERE username='u2'");
        expect(res.rows.length).toEqual(0);
    });

    test("deactivate with created tours", async function () {
        const result = await User.remove("u1");

        expect(result).toEqual({ deactivated: "u1" });

        const res = await db.query(
            "SELECT * FROM users WHERE username='u2'");
        expect(res.rows.length).toEqual(1);
        expect(res.rows[0].is_active).toEqual(true);
    });


    test("not found if no such user", async function () {
        try {
            await User.remove("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
