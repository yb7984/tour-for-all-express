const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const User = require('./user');
const Tour = require('./tour');
const TourTemplate = require("./tourTemplate");
const { ROLE_USER } = require("./role");
const { TOUR_STATUS_PUBLIC } = require('./tourStatus');
const TourPlayer = require("./tourPlayer.js");

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users_tours_follow");
    await db.query("DELETE FROM users_follow");
    await db.query("DELETE FROM tours_players");
    await db.query("DELETE FROM tours_templates");
    await db.query("DELETE FROM tours");
    await db.query("DELETE FROM users");


    await db.query("ALTER SEQUENCE tours_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE tours_templates_id_seq RESTART WITH 1");

    await db.query(`
                INSERT INTO users(username,
                                                    password,
                                                    first_name,
                                                    last_name,
                                                    email)
                VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
                             ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
                RETURNING username`,
        [
            await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
            await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
        ]);

    await db.query(`
            INSERT INTO tours
                    (slug , title , image , guaranteed , description , 
                    creator , price , entry_fee , start , setting , 
                    status , start_time , end_time, is_active)
            VALUES 
                    ('t-1' , 't-1' , '' , 0 , 't-description' , 
                    'u1' , 10 , 2 , '${t1Start.toISOString()}' , '' , 
                    1 , NULL , NULL , TRUE),

                    ('t-start' , 't-start' , '' , 0 , 't-start-description' , 
                    'u1' , 10 , 2 , '${(new Date(Date.now() - 1000 * 60 * 60)).toISOString()}' , '' , 
                    9 , '${(new Date(Date.now() - 1000 * 60 * 60)).toISOString()}' , NULL , TRUE),

                    ('t-end' , 't-end' , '' , 0 , 't-end-description' , 
                    'u1' , 10 , 2 , '${(new Date(Date.now() - 1000 * 60 * 60 * 24)).toISOString()}' , '' , 
                    10 , '${(new Date(Date.now() - 1000 * 60 * 60 * 24)).toISOString()}' , '${(new Date(Date.now() - 1000 * 60 * 60 * 20)).toISOString()}' , TRUE),

                    ('t-cancel' , 't-cancel' , '' , 0 , 't-cancel-description' , 
                    'u1' , 10 , 2 , '${(new Date(Date.now() - 1000 * 60 * 60 * 24)).toISOString()}' , '' , 
                    2 , '${(new Date(Date.now() - 1000 * 60 * 60 * 24)).toISOString()}' , '${(new Date(Date.now() - 1000 * 60 * 60 * 20)).toISOString()}' , TRUE)
            `);


    await db.query(`
            INSERT INTO tours_templates
                    (title , image , guaranteed , description , 
                    creator , price , entry_fee , setting, is_public)
            VALUES 
                    ('tt-1' , '' , 0 , 'tt-description' , 
                    'u1' , 10 , 2 , '' , TRUE)
            `);

    await db.query(`
            INSERT INTO users_follow (username , following)
            VALUES
                ('u1' , 'u2')
    `);


    await db.query(`
            INSERT INTO users_tours_follow (username , tour_id)
            VALUES
                ('u1' , 1)
    `);

    await db.query(`
            INSERT INTO tours_players (tour_id, username)
            VALUES
                (1 , 'u1')
    `)
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}

const u1 = new User({
    username: "u1",
    password: '',
    firstName: "U1F",
    lastName: "U1L",
    email: "u1@email.com",
    role: ROLE_USER,
    isActive: true
});

const u2 = new User({
    username: "u2",
    password: '',
    firstName: "U2F",
    lastName: "U2L",
    email: "u2@email.com",
    role: ROLE_USER,
    isActive: true
});

const t1Start = new Date(Date.now() + 24 * 60 * 60 * 1000);

const t1 = new Tour(
    {
        id: 1,
        slug: "t-1",
        title: "t-1",
        creator: "u1",
        price: 10,
        entryFee: 2,
        start: t1Start,
        status: TOUR_STATUS_PUBLIC,
        isActive: true
    }
);


const tt1 = new TourTemplate(
    {
        id: 1,
        title: "tt-1",
        description: "tt-description",
        creator: "u1",
        price: 10,
        entryFee: 2,
        isPublic: true
    }
);

const p1 = new TourPlayer(
    {
        tourId: 1,
        username: 'u1'
    }
);



module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1,
    u2,
    t1,
    tt1,
    p1
};