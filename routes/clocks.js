const Tour = require("../models/tour");
const TourClockUser = require("../models/tourClockUser");
const { TOUR_STATUS_PUBLIC, TOUR_STATUS_STARTED } = require("../models/tourStatus");

/** Function for Routes for tour clocks. */


/** Handle a persistent connection to /tours/[tourId]/clock
 *
 * Note that this is only called *once* per client --- not every time
 * a particular websocket connection is sent.
 *
 * `ws` becomes the socket for the client; it is specific to that visitor.
 * The `ws.send` method is how we'll send messages back to that socket.
 */
async function clocksRouteFunction(ws, req, next) {
    try {
        const tour = await Tour.get(req.params.handle);

        if (tour && [TOUR_STATUS_PUBLIC, TOUR_STATUS_STARTED].includes(tour.status)) {
            const user = new TourClockUser(
                ws.send.bind(ws), // fn to call to message this user
                tour.id // using id of the tour to identify the clock
            );

            // register handlers for message-received, connection-closed
            ws.on('message', async function (data) {
                try {
                    await user.handleMessage(data);
                } catch (err) {
                    if (process.env.NODE_ENV !== "test") console.error(err);
                }
            });

            ws.on('close', function () {
                try {
                    user.handleClose();
                } catch (err) {
                    if (process.env.NODE_ENV !== "test") console.error(err);
                }
            });
        }
    } catch (err) {
        if (process.env.NODE_ENV !== "test") console.error(err);
    }
}

module.exports = clocksRouteFunction;