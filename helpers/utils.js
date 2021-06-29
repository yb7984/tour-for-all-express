
/** Util functons for the project */

/**
 * Fitler the input if it is integer, make sure it return as a number
 * otherwise return NaN
 * @param {*} value 
 * @returns 
 */
function filterInt(value) {
    if (/^[-+]?(\d+)$/.test(value)) {
        return Number(value)
    } else {
        return NaN
    }
}

/**
 * Fitler the input if it is positive integer, make sure it return as a number
 * otherwise return NaN
 * @param {*} value 
 * @returns 
 */
function filterPositiveInt(value) {
    if (/^\d+$/.test(value)) {
        return Number(value);
    } else {
        return NaN
    }
}

module.exports = {
    filterInt,
    filterPositiveInt
}