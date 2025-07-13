let clients = [];
let boxStates = {
    row1: [false, false, true, false, false],
    row2: [false, false, true, false, false]
};
let userCount = 0;

export default function handler(req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Assign user role
    const user = userCount < 2 ? `row${userCount + 1}` : 'spectator';
    if (userCount < 2) userCount++;

    // Send initial state
    res.write(`data: ${JSON.stringify({
        states: boxStates,
        user: user !== 'spectator' ? user : null
    })}\n\n`);

    // Store client
    const clientId = Date.now();
    clients.push({ id: clientId, res });

    // Clean up on disconnect
    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
        if (user !== 'spectator') userCount--;
    });
}

// Broadcast updates to all clients
export function broadcastUpdate() {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({
            states: boxStates
        })}\n\n`);
    });
}