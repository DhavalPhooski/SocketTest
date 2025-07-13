let clients = [];
let boxStates = {
    row1: [false, false, true, false, false],
    row2: [false, false, true, false, false]
};

// Track available user slots
const availableUsers = {
    row1: true,
    row2: true
};

export default function handler(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Assign user role
    let user = 'spectator';
    if (availableUsers.row1) {
        user = 'row1';
        availableUsers.row1 = false;
    } else if (availableUsers.row2) {
        user = 'row2';
        availableUsers.row2 = false;
    }

    // Create client ID
    const clientId = Date.now();

    // Send initial state
    res.write(`data: ${JSON.stringify({
        states: boxStates,
        user: user !== 'spectator' ? user : null,
        clientId
    })}\n\n`);

    // Store client
    clients.push({ id: clientId, res, user });

    // Clean up on disconnect
    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        if (user === 'row1') availableUsers.row1 = true;
        if (user === 'row2') availableUsers.row2 = true;
        console.log(`Client ${clientId} (${user}) disconnected`);
    });
}

export function broadcastUpdate() {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({
            states: boxStates
        })}\n\n`);
    });
}