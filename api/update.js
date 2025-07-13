import { broadcastUpdate } from './sse';

let boxStates = {
    row1: [false, false, true, false, false],
    row2: [false, false, true, false, false]
};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { row, index } = req.body;
        
        // Validate input
        if (!['row1', 'row2'].includes(row) || index < 0 || index > 4) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Update the box states
        boxStates[row] = boxStates[row].map((_, i) => i === index);
        
        console.log(`Updated ${row} box ${index}`); // Debug log
        broadcastUpdate();
        
        return res.status(200).json({ success: true, states: boxStates });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({ error: error.message });
    }
}