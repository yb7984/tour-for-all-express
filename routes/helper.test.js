"use strict";

const request = require("supertest");

const Tour = require("../models/tour");
const { ensureAdminOrCreator } = require("./helper");
const { UnauthorizedError } = require("../expressError");

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

/**************** ensureAdminOrCreator */

describe("ensureAdminOrCreator", function () {
    test("works with admin login", async function () {
        const res = { locals: { user: { username: "u1", role: ROLE_ADMIN } } };
        const tour = await ensureAdminOrCreator(1, res);

        expect(tour).toEqual(t1);
    });


    test("works with not admin login but the creator", async function () {
        const res = { locals: { user: { username: "u2", role: ROLE_USER } } };
        const tour = await ensureAdminOrCreator(2, res);

        expect(tour).toEqual(t2);
    });

    test("unauth if login not admin and not the creator", async function () {
        try {
            const res = { locals: { user: { username: "u2", role: ROLE_USER } } };
            const tour = await ensureAdminOrCreator(2, res);
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });

    test("unauth if no login", async function () {
        try {
            const res = { locals: {} };
            const tour = await ensureAdminOrCreator(2, res);
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });
});

