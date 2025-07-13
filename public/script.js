document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    let eventSource;
    let currentUser = null;

    // Initialize SSE connection
    function connectSSE() {
        statusEl.textContent = "Connecting...";
        statusEl.style.color = "blue";
        
        eventSource = new EventSource('/api/sse');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received update:", data); // Debug log
            
            updateBoxes(data.states);
            if (data.user) {
                currentUser = data.user;
                console.log("Assigned user:", currentUser); // Debug log
            }
            statusEl.textContent = `Connected as ${currentUser || 'Spectator'} ✅`;
            statusEl.style.color = 'green';
        };

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error); // Debug log
            statusEl.textContent = 'Disconnected ❌ (Reconnecting...)';
            statusEl.style.color = 'red';
            setTimeout(connectSSE, 3000);
        };
    }

    // Update box states with user permissions
    function updateBoxes(states) {
        ['row1', 'row2'].forEach(row => {
            const boxes = document.querySelectorAll(`#${row} .box`);
            boxes.forEach((box, index) => {
                const isActive = states[row][index];
                box.classList.toggle('active', isActive);
                
                // Only allow clicks if this is the user's row
                box.style.cursor = currentUser === row ? 'pointer' : 'not-allowed';
                box.title = currentUser === row 
                    ? 'Click to select' 
                    : `Only ${row} user can control these boxes`;
            });
        });
    }

    // Handle box clicks with user verification
    document.querySelectorAll('.box').forEach(box => {
        box.addEventListener('click', async function() {
            if (!currentUser) {
                console.warn("No user assigned yet");
                return;
            }
            
            const row = this.parentElement.id;
            const index = parseInt(this.dataset.index);
            
            console.log(`Click detected on ${row} box ${index} by ${currentUser}`); // Debug log
            
            if (currentUser !== row) {
                console.warn(`User ${currentUser} cannot control ${row}`);
                return;
            }

            try {
                console.log("Sending update request..."); // Debug log
                const response = await fetch('/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ row, index })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log("Update successful"); // Debug log
            } catch (error) {
                console.error('Update failed:', error);
                alert('Failed to update box. Please check console for details.');
            }
        });
    });

    connectSSE();
});