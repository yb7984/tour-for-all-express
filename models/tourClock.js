/** TourClocks that can be joined/left/broadcast to. */

// in-memory storage of tourId -> clock

const CLOCKS = new Map();

/** TourClock is a collection of listening members; this becomes a "chat clock"
 *     where individual users can join/leave/broadcast to.
 */

class TourClock {
    /** 
     * get clock by that name, creating if nonexistent
     **/
    static get(tourId) {
        if (!CLOCKS.has(tourId)) {
            CLOCKS.set(tourId, new TourClock(tourId));
        }

        return CLOCKS.get(tourId);
    }

    /** 
     * make a new clock, starting with empty set of listeners 
     * */
    constructor(tourId) {
        this.name = tourId;
        this.members = new Set();
    }

    /** member joining a clock. */

    join(member) {
        this.members.add(member);

        for (let mem of this.members) {
            if (mem.clockManager === true) {
                mem.send("join");
                break;
            }
        }
    }

    /** member leaving a clock. */

    leave(member) {
        this.members.delete(member);
    }

    /** send message to all members excepts exclues in a clock. */
    broadcast(data, excludes = []) {
        for (let member of this.members) {
            if (excludes && excludes.includes(member.name)) {
                continue;
            }
            member.send(JSON.stringify(data));
        }
    }
}

module.exports = TourClock;
