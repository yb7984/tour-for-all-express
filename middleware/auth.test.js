"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdminLoggedIn ,
    ensureCorrectUserOrAdmin
} = require("./auth");
const { ROLE_USER, ROLE_ADMIN } = require("../models/role");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", role: ROLE_USER}, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", role: ROLE_USER }, "wrong");

describe("authenticateJWT", function () {
    test("works: via header", function () {
        expect.assertions(2);
        
        const req = { headers: { authorization: `Bearer ${testJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({
            user: {
                iat: expect.any(Number),
                username: "test",
                role: ROLE_USER,
            },
        });
    });

    test("works: no header", function () {
        expect.assertions(2);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });

    test("works: invalid token", function () {
        expect.assertions(2);
        const req = { headers: { authorization: `Bearer ${badJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });
});


describe("ensureLoggedIn", function () {
    test("works", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { username: "test", role: ROLE_USER } } };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLoggedIn(req, res, next);
    });

    test("unauth if no login", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        ensureLoggedIn(req, res, next);
    });


    describe("ensureAdminLoggedIn", function () {
        test("works", function () {
            expect.assertions(1);
            const req = {};
            const res = { locals: { user: { username: "test", role: ROLE_ADMIN } } };
            const next = function (err) {
                expect(err).toBeFalsy();
            };
            ensureAdminLoggedIn(req, res, next);
        });

        test("unauth if login not admin", function () {
            expect.assertions(1);
            const req = {};
            const res = { locals: { user: { username: "test", role: ROLE_USER } } };
            const next = function (err) {
                expect(err instanceof UnauthorizedError).toBeTruthy();
            };
            ensureAdminLoggedIn(req, res, next);
        });

        test("unauth if no login", function () {
            expect.assertions(1);
            const req = {};
            const res = { locals: {} };
            const next = function (err) {
                expect(err instanceof UnauthorizedError).toBeTruthy();
            };
            ensureAdminLoggedIn(req, res, next);
        });
    });


    describe("ensureCorrectUserOrAdmin", function () {
        test("works with admin login", function () {
            expect.assertions(1);
            const req = {};
            const res = { locals: { user: { username: "test", role: ROLE_ADMIN } } };
            const next = function (err) {
                expect(err).toBeFalsy();
            };
            ensureCorrectUserOrAdmin(req, res, next);
        });


        test("works with not admin login but the same user", function () {
            expect.assertions(1);
            const req = { params: { username: "test" } };
            const res = { locals: { user: { username: "test", role: ROLE_USER } } };
            const next = function (err) {
                expect(err).toBeFalsy();
            };
            ensureCorrectUserOrAdmin(req, res, next);
        });

        test("unauth if login not admin and not the same user", function () {
            expect.assertions(1);
            const req = { params: { username: "test1" } };
            const res = { locals: { user: { username: "test", role: ROLE_USER} } };
            const next = function (err) {
                expect(err instanceof UnauthorizedError).toBeTruthy();
            };
            ensureCorrectUserOrAdmin(req, res, next);
        });

        test("unauth if no login", function () {
            expect.assertions(1);
            const req = {};
            const res = { locals: {} };
            const next = function (err) {
                expect(err instanceof UnauthorizedError).toBeTruthy();
            };
            ensureCorrectUserOrAdmin(req, res, next);
        });
    });
});
