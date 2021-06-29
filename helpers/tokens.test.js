const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");
const { ROLE_USER , ROLE_ADMIN } = require("../models/role");

describe("createToken", function () {
    test("works: not admin", function () {
        const token = createToken({ username: "test", role: ROLE_USER });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: ROLE_USER,
        });
    });

    test("works: admin", function () {
        const token = createToken({ username: "test", role: ROLE_ADMIN });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: ROLE_ADMIN,
        });
    });

    test("works: default no role", function () {
        // given the security risk if this didn't work, checking this specifically
        const token = createToken({ username: "test" });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            username: "test",
            role: ROLE_USER,
        });
    });
});
