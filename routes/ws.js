const WS_SETTING = {
    expressWs: null
}

/**
 * 
 * @param {*} expressWs 
 */
function setWs(expressWs) {
    WS_SETTING.expressWs = expressWs;
}

/**
 * Broadcast to who has connected to certain endpoint.
 * @param {*} endpoint 
 * @param {*} data 
 */
function broadcastByEndpoint(endpoint, data) {
    try {
        let wss = WS_SETTING.expressWs.getWss(endpoint);

        wss.clients.forEach((client) => {
            client.send(data)
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Broadcast when the tournament information is updated
 * @param {Integer} tourId 
 */
function broadcastTourUpdate(tourId) {
    broadcastByEndpoint(`/tours/${tourId}/clock`, `tour_updated_${tourId}`);
}

module.exports = { setWs, broadcastByEndpoint, broadcastTourUpdate };