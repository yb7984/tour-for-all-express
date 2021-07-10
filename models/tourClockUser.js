/** Functionality related to clock sync. */

// TourClock is an abstraction of a channel
const TourClock = require('./tourClock');

/** TourClockUser is a individual connection from client -> server to connect. */

class TourClockUser {
    /** make connect: store connection-device, clock */

    constructor(send, tourId) {
        this._send = send; // "send" function for this user
        this.clock = TourClock.get(tourId); // clock user will be in
        this.name = null; // becomes the username of the visitor

        console.log(`created connect in ${this.clock.name}`);
    }

    /** send msgs to this client using underlying connection-send-function */
    send(data) {
        try {
            this._send(data);
        } catch {
            // If trying to send to a user fails, ignore it
        }
    }

    /** handle joining: add to clock members, send to the clock manager to get a sync */
    handleJoin(name, clockManager) {
        this.name = name;
        this.clockManager = clockManager;
        this.clock.join(this);
    }

    /** handle a sync: broadcast to everyone. */
    async handleSync(data) {
        this.clock.broadcast(data , [this.name]);
    }

    /** Handle messages from client:
     *
     * - {type: "join", name: username} : join
     * - {type: "sync", data: clock }   : sync
     */

    async handleMessage(jsonData) {
        let msg = JSON.parse(jsonData);

        // console.log(msg)

        if (msg.type === 'join') this.handleJoin(msg.name, msg.clockManager);
        else if (msg.type === 'sync') await this.handleSync(msg.data);
        else throw new Error(`bad message: ${msg.type}`);
    }

    /** Connection was closed: leave clock */

    handleClose() {
        this.clock.leave(this);
    }
}

module.exports = TourClockUser;
