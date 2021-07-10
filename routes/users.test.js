"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

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

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


const u1 = new User({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "u1@email.com",
    role: ROLE_ADMIN
});
const u2 = new User({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "u2@email.com",
    role: ROLE_USER
});
const u3 = new User({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "u3@email.com",
    role: ROLE_USER
});

/************************************** POST /users */

describe("POST /users", function () {
    const newUserData = {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        role: ROLE_USER
    };
    test("works for users: create non-admin", async function () {
        const resp = await request(app)
            .post("/users")
            .send(newUserData)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            user: {
                ...(new User(newUserData)),
                password: "",
                created: expect.any(String),
                updated: expect.any(String)
            }, token: expect.any(String),
        });
    });

    test("works for users: create admin", async function () {
        const resp = await request(app)
            .post("/users")
            .send({
                ...newUserData,
                role: ROLE_ADMIN
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            user: {
                ...(new User(newUserData)),
                password: "",
                role: ROLE_ADMIN,
                created: expect.any(String),
                updated: expect.any(String)
            }, token: expect.any(String),
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/users")
            .send(newUserData);
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for not admin", async function () {
        const resp = await request(app)
            .post("/users")
            .send(newUserData)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request if missing data", async function () {
        const resp = await request(app)
            .post("/users")
            .send({
                username: "u-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request if invalid data", async function () {
        const resp = await request(app)
            .post("/users")
            .send({
                username: "u-new",
                firstName: "First-new",
                lastName: "Last-newL",
                password: "password-new",
                email: "not-an-email"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});


/************************************** POST /users/:username/follow */

describe("POST /users/:username/:follow", function () {
    test("works for users: follow", async function () {
        const resp = await request(app)
            .post("/users/u1/follow")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            following: "u1"
        });
    });


    test("works for users: defollow", async function () {
        const resp = await request(app)
            .post("/users/u2/defollow")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({});
    });
});

/************************************** GET /users */

describe("GET /users", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            users: [
                {
                    ...u1,
                    created: expect.any(String),
                    updated: expect.any(String)
                },
                {
                    ...u2,
                    created: expect.any(String),
                    updated: expect.any(String)
                },
                {
                    ...u3,
                    created: expect.any(String),
                    updated: expect.any(String)
                }
            ],
            total: 3,
            perPage: 20,
            page: 1
        });
    });

    test("works for users with conditions", async function () {
        let resp = await request(app)
            .get("/users?term=u1&role=1")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            users: [
                {
                    ...u1,
                    created: expect.any(String),
                    updated: expect.any(String)
                }
            ],
            total: 1,
            perPage: 20,
            page: 1
        });
        resp = await request(app)
            .get("/users?term=u1&isActive=true")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            users: [
                {
                    ...u1,
                    created: expect.any(String),
                    updated: expect.any(String)
                }],
            total: 1,
            perPage: 20,
            page: 1
        });
        resp = await request(app)
            .get("/users?term=u1&isActive=false")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            users: [],
            total: 0,
            perPage: 20,
            page: 1
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .get("/users");
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for not admin", async function () {
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE users CASCADE");
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
    test("works for users login as admin", async function () {
        const resp = await request(app)
            .get(`/users/u1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u1,
                followingTours: [1],
                followings: ["u2"],
                followers: [],
                created: expect.any(String),
                updated: expect.any(String)
            },
        });
    });


    test("works for users login the same user", async function () {
        const resp = await request(app)
            .get(`/users/u2`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u2,
                followingTours: [],
                followings: [],
                followers: ["u1"],
                created: expect.any(String),
                updated: expect.any(String)
            },
        });
    });

    test("works for anon", async function () {
        const resp = await request(app)
            .get(`/users/u2`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u2,
                followingTours: [],
                followings: [],
                followers: ["u1"],
                created: expect.any(String),
                updated: expect.any(String)
            },
        });
    });

    test("not found if user not found", async function () {
        const resp = await request(app)
            .get(`/users/nope`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
    test("works for users login as admin", async function () {
        const resp = await request(app)
            .patch(`/users/u1`)
            .send({
                firstName: "New",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u1,
                created: expect.any(String),
                updated: expect.any(String),
                firstName: "New",
                followingTours:[1],
                followings:["u2"]
            },
        });
    });


    test("works for users login the same user", async function () {
        const resp = await request(app)
            .patch(`/users/u2`)
            .send({
                firstName: "New",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u2,
                created: expect.any(String),
                updated: expect.any(String),
                firstName: "New",
                followers:["u1"]
            },
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/users/u1`)
            .send({
                firstName: "New",
            });
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for login not the same user", async function () {
        const resp = await request(app)
            .patch(`/users/u1`)
            .send({
                firstName: "New",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found if no such user", async function () {
        const resp = await request(app)
            .patch(`/users/nope`)
            .send({
                firstName: "Nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request if invalid data", async function () {
        const resp = await request(app)
            .patch(`/users/u1`)
            .send({
                firstName: 42,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("works: set new password", async function () {
        const resp = await request(app)
            .patch(`/users/u1`)
            .send({
                password: "new-password",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            user: {
                ...u1,
                created: expect.any(String),
                updated: expect.any(String),
                followingTours:[1],
                followings:["u2"]
            }
        });
        const isSuccessful = await User.authenticate("u1", "new-password");
        expect(isSuccessful).toBeTruthy();
    });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
    test("works for users login as admin and not created tour", async function () {
        const resp = await request(app)
            .delete(`/users/u3`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: "u3" });
    });


    test("works for users login the same user", async function () {
        const resp = await request(app)
            .delete(`/users/u3`)
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.body).toEqual({ deleted: "u3" });
    });

    test("works for user already attended tour, deactivate", async function () {
        const resp = await request(app)
            .delete(`/users/u1`)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.body).toEqual({ deactivated: "u1" });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/users/u1`);
        expect(resp.statusCode).toEqual(401);
    });


    test("unauth for login not the same user", async function () {
        const resp = await request(app)
            .delete(`/users/u1`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found if user missing", async function () {
        const resp = await request(app)
            .delete(`/users/nope`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
