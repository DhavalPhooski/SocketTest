let clients = [];
let boxStates = {
    row1: [false, false, true, false, false],
    row2: [false, false, true, false, false]
};
let userAssignments = {
    row1: null,
    row2: null
};

export default function handler(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Assign user role
    let user = 'spectator';
    if (!userAssignments.row1) {
        user = 'row1';
        userAssignments.row1 = true;
    } else if (!userAssignments.row2) {
        user = 'row2';
        userAssignments.row2 = true;
    }

    // Send initial state
    res.write(`data: ${JSON.stringify({
        states: boxStates,
        user: user !== 'spectator' ? user : null
    })}\n\n`);

    // Store client
    const clientId = Date.now();
    clients.push({ id: clientId, res, user });

    // Clean up on disconnect
    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        if (user === 'row1') userAssignments.row1 = null;
        if (user === 'row2') userAssignments.row2 = null;
    });
}

export function broadcastUpdate() {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({
            states: boxStates
        })}\n\n`);
    });
}