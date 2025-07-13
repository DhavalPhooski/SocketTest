import { broadcastUpdate } from './sse';

let boxStates = {
    row1: [false, false, true, false, false],
    row2: [false, false, true, false, false]
};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    try {
        const { row, index } = req.body;
        
        // Update the box states
        boxStates[row] = boxStates[row].map((_, i) => i === index);
        
        // Broadcast the update
        broadcastUpdate();
        
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}