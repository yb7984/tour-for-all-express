const { ExpressError } = require("../expressError");
const { filterInt, filterPositiveInt } = require("./utils");


describe("filterInt", function () {
    test("works", function () {
        expect(filterInt(1)).toBe(1);
        expect(filterInt("1")).toBe(1);
        expect(filterInt(123)).toBe(123);
        expect(filterInt("123")).toBe(123);
        expect(filterInt(-123)).toBe(-123);
        expect(filterInt("-123")).toBe(-123);
    });


    test("not works", function () {
        expect(isNaN(filterInt(1.2))).toBe(true);
        expect(isNaN(filterInt("343.2"))).toBe(true);
        expect(isNaN(filterInt(true))).toBe(true);
    });
});



describe("filterPositiveInt", function () {
    test("works", function () {
        expect(filterPositiveInt(1)).toBe(1);
        expect(filterPositiveInt("1")).toBe(1);
        expect(filterPositiveInt(123)).toBe(123);
        expect(filterPositiveInt("123")).toBe(123);
    });


    test("not works", function () {
        expect(isNaN(filterPositiveInt(-123))).toBe(true);
        expect(isNaN(filterPositiveInt("-123"))).toBe(true);
        expect(isNaN(filterInt(1.2))).toBe(true);
        expect(isNaN(filterInt("343.2"))).toBe(true);
        expect(isNaN(filterInt(true))).toBe(true);
    });
});