const { BadRequestError } = require("../expressError");

/**
 * Generate the set sql from a dictionary of data need to be updated
 * @param {*} dataToUpdate Data need to be updated, key, value pairs 
 *                                                like {firstName: 'Aliya', age: 32 , ...}
 * @param {*} jsToSql mapping for js keys to sql field names 
 *                                         like {firstName : 'first_name' , ...}
 * @returns an oject containing the set part of the sql query and the values for the query
 *                     like {
 *                                setCols : '"first_name"=$1 , "age"=$2' , 
 *                                values: ["Aliya" , 32]
 *                            }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    //handling when dataToUpdate is null or undefined or invalid datatype
    if (dataToUpdate === undefined ||
        dataToUpdate === null ||
        typeof dataToUpdate !== "object") {
        throw new BadRequestError("No data");
    }

    //handling when jsToSql is set to null or wrong data type
    if (jsToSql === undefined ||
        jsToSql === null ||
        typeof jsToSql !== "object") {
        jsToSql = {};
    }

    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");

    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );

    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}

/**
 * Generate the where sql from a array of search condition
 * @param {*} dataToSearch Data need to be search, Array of object
 *                                                like [{field: 'name' , operator : '' , value : 's'} , ...]
 * @returns an oject containing the where part of the sql query and the values for the query
 *                     like {
 *                                wheres : '"name"=$1 and ...' , 
 *                                values: ["s" , ...]
 *                            }
 */
function sqlForSearch(dataToSearch) {
    if (dataToSearch === undefined ||
        dataToSearch === null ||
        !Array.isArray(dataToSearch) ||
        dataToSearch.length === 0) {
        //no conditions, return empty string for sql
        return { wheres: "", values: [] };
    }

    const conditions = [];
    const values = [];

    dataToSearch.forEach((item, idx) => {
        let { fields, operator, value } = item;

        operator = operator.toUpperCase().trim();

        //change fields to an Array
        if (typeof fields === "string") {
            fields = fields.indexOf(",") === -1 ? [fields] : fields.split(",").map(name => name.trim());
        }
        conditions.push("(" + fields.map(name => {
            return `"${name}" ${operator} $${idx + 1}`
        }).join(" OR ") + ")");


        if (operator === "LIKE" || operator === "ILIKE") {
            values.push(`%${value}%`);
        } else {
            values.push(value);
        }
    });

    return {
        wheres: conditions.join(" AND "),
        values
    };
}

module.exports = { sqlForPartialUpdate, sqlForSearch };
