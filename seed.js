const bcrypt = require("bcrypt");
const axios = require("axios");

const db = require("./db.js");
const { BCRYPT_WORK_FACTOR } = require("./config");
const User = require('./models/user');
const Tour = require('./models/tour');
const { ROLE_USER } = require("./models/role");
const { TOUR_STATUS_PUBLIC } = require('./models/tourStatus');
const TourPlayer = require("./models/tourPlayer.js");

async function seedAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users_tours_follow");
    await db.query("DELETE FROM users_follow");
    await db.query("DELETE FROM tours_players");
    await db.query("DELETE FROM tours");
    await db.query("DELETE FROM users");


    await db.query("ALTER SEQUENCE tours_id_seq RESTART WITH 1");

    await db.query(`
                INSERT INTO users(username,
                                                    password,
                                                    first_name,
                                                    last_name,
                                                    email, role)
                VALUES ('admin', $1, 'admin', 'admin', 'bobowu@outlook.com', 1)
                RETURNING username`,
        [
            await bcrypt.hash("password", BCRYPT_WORK_FACTOR)
        ]);


    const result = await axios.get("https://randomuser.me/api/?results=50");


    const usernames = ["admin"];
    const password = "password";
    for (const item of result.data.results) {
        const username = item.login.username;
        const user = {
            username,
            password,
            firstName: item.name.first,
            lastName: item.name.last,
            email: item.email,
            phone: item.phone,
            role: ROLE_USER,
            image: item.picture.medium
        };

        await User.register(user);
        delete user.username;
        delete user.password;
        await User.update(username, user);

        usernames.push(username)

    }

    const titles = [
        "$10K Guaranteed Tournament",
        "$100 Tournament",
        "Bounty Tournament",
        "Mega Stack Tournament",
        "Sit N Go Tournament"
    ]

    const images = ["pokertour1.jpeg", "pokertour2.jpeg", "pokertour3.jpeg"]

    for (let i = 0; i < 50; i++) {
        const data = {
            "title": titles[Math.floor(Math.random() * titles.length)] + " " + new Date(Date.now() + 3600 * 1000 * 24 * i).toDateString(),
            "image": `/uploads/admin/${images[Math.floor(Math.random() * images.length)]}`,
            "guaranteed": 10000,
            "stack": 10000,
            "description": "1. Registration will be open a minimum of 30 minutes prior to each tournament event being held that day. Registration will generally remain open until the\nconclusion of the 6th level.\n2. Players will have the opportunity to start with a full stack. Once a player has registered their chips will be put into play.\n3. No phone-ins or reservations.\n4. Seating will be randomly assigned; any requests for a particular table and/or seat will not be honored unless approved by a supervisor. Exceptions may be\ngranted to accommodate guests with special needs.\n5. Players may only play in one event at a time. (No table jumping)\n6. reserves the right to limit seating or to cancel events at its sole discretion.\n7. reserves the right to allow alternates or late entries.\n8. Registration receipts are non-transferable.\n9. You must have an active Rewards Card in order to enter a tournament. Rewards Cards are free with valid ID to players over 21 years of age\nand are available at any Rewards location.\nSurvivor Rules & Payout Policies\n1. Each prize pool will be paid out according to the following: The maximum number of 10 TIMES the BUY-IN will be awarded from the prize pool. Once the\nremaining prize pool is LESS than 10 TIMES the BUY-IN it will be awarded as a single cash prize, unless stated otherwise.\n2. The Table Consolidation Policies of the Poker Tournament Rules will apply. Additionally, reserves the right to redraw tables at any time and to\nbreak tables randomly. Players who are thought to be in collusion will be penalized according to the Tournament Rules.\nGeneral",
            "creator": usernames[Math.floor(Math.random() * usernames.length)],
            "price": 100,
            "entryFee": 20,
            "start": new Date(Date.now() + 3600 * 1000 * 24 * i),
            "setting": "{\"defalutDuration\":20,\"defaultBreakDuration\":10,\"levels\":[{\"id\":\"2552746a-183a-4f9c-a4f9-c42d9be4b666\",\"levelType\":\"play\",\"bigBlind\":25,\"smallBlind\":50,\"ante\":0,\"bigBlindAnte\":0,\"duration\":20},{\"id\":\"95ee683d-8ce2-443b-b38a-af4ba28a2aa6\",\"levelType\":\"play\",\"bigBlind\":50,\"smallBlind\":100,\"ante\":0,\"bigBlindAnte\":0,\"duration\":20},{\"id\":\"d812a13d-23c3-4a27-8667-0e24cec9fbb7\",\"levelType\":\"play\",\"bigBlind\":100,\"smallBlind\":200,\"ante\":0,\"bigBlindAnte\":0,\"duration\":20},{\"id\":\"84b5720e-3924-413f-89da-99f9fecfcbe7\",\"levelType\":\"play\",\"bigBlind\":150,\"smallBlind\":300,\"ante\":0,\"bigBlindAnte\":0,\"duration\":20},{\"id\":\"5b3d5ac5-1f42-423f-bc9d-f53862c1613f\",\"levelType\":\"break\",\"bigBlind\":150,\"smallBlind\":300,\"ante\":0,\"bigBlindAnte\":0,\"duration\":10},{\"id\":\"34f86a92-6981-4cd0-9f0f-95d5e3d5fc2f\",\"levelType\":\"play\",\"bigBlind\":200,\"smallBlind\":400,\"ante\":0,\"bigBlindAnte\":0,\"duration\":20},{\"id\":\"45292111-5829-40d5-be1d-f8210cd64629\",\"levelType\":\"play\",\"bigBlind\":300,\"smallBlind\":600,\"ante\":0,\"bigBlindAnte\":600,\"duration\":20},{\"id\":\"89cb0c38-5bc6-462a-a439-18f003302ef5\",\"levelType\":\"play\",\"bigBlind\":400,\"smallBlind\":800,\"ante\":0,\"bigBlindAnte\":800,\"duration\":20},{\"id\":\"bd76bb73-666d-4e11-97d3-7282d0c4f670\",\"levelType\":\"play\",\"bigBlind\":1000,\"smallBlind\":2000,\"ante\":0,\"bigBlindAnte\":2000,\"duration\":20},{\"id\":\"aa9be5bf-0d42-48d5-a16c-28061484bfe9\",\"levelType\":\"break\",\"bigBlind\":1000,\"smallBlind\":2000,\"ante\":0,\"bigBlindAnte\":2000,\"duration\":10},{\"id\":\"488d5668-f142-4fb4-b6b4-964c8a82a58c\",\"levelType\":\"play\",\"bigBlind\":1500,\"smallBlind\":3000,\"ante\":0,\"bigBlindAnte\":3000,\"duration\":20},{\"id\":\"eec0fe76-c62e-48c2-8969-7a184f741db9\",\"levelType\":\"play\",\"bigBlind\":2000,\"smallBlind\":4000,\"ante\":0,\"bigBlindAnte\":4000,\"duration\":20},{\"id\":\"6023e117-c76c-4b96-8811-d863034d7f18\",\"levelType\":\"play\",\"bigBlind\":3000,\"smallBlind\":6000,\"ante\":0,\"bigBlindAnte\":6000,\"duration\":20},{\"id\":\"95d5656f-6066-46a4-97c2-8e3e0b1cec27\",\"levelType\":\"play\",\"bigBlind\":4000,\"smallBlind\":8000,\"ante\":0,\"bigBlindAnte\":8000,\"duration\":20},{\"id\":\"340b9072-21d6-48e3-b441-ff71a3c870c4\",\"levelType\":\"break\",\"bigBlind\":4000,\"smallBlind\":8000,\"ante\":0,\"bigBlindAnte\":8000,\"duration\":10},{\"id\":\"9e5a73ac-2f18-4a82-817d-65436a2f553f\",\"levelType\":\"play\",\"bigBlind\":5000,\"smallBlind\":10000,\"ante\":0,\"bigBlindAnte\":10000,\"duration\":20},{\"id\":\"4e6ff83c-0e83-4b53-ac13-7c99422b2861\",\"levelType\":\"play\",\"bigBlind\":6000,\"smallBlind\":12000,\"ante\":0,\"bigBlindAnte\":12000,\"duration\":20},{\"id\":\"67052c18-c37a-436b-bc1f-c8f4dbb18aed\",\"levelType\":\"play\",\"bigBlind\":8000,\"smallBlind\":16000,\"ante\":0,\"bigBlindAnte\":16000,\"duration\":20},{\"id\":\"0d50044d-b145-43ab-a1fc-fd8e611fb595\",\"levelType\":\"play\",\"bigBlind\":10000,\"smallBlind\":20000,\"ante\":0,\"bigBlindAnte\":20000,\"duration\":20}]}",
            "clockSetting": "",
            "status": 1
        };

        const tour = await Tour.insert(data);

        const count = Math.floor(Math.random() * 50);
        for (let j = 0; j < count; j++) {
            TourPlayer.insert(tour.id, usernames[Math.floor(Math.random() * usernames.length)]);
            User.followTour(usernames[Math.floor(Math.random() * usernames.length)], tour.id);
        }
    }
}

seedAll();