document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    let eventSource;
    let currentUser = null;
    let clientId = null;

    function connectSSE() {
        statusEl.textContent = "Connecting...";
        statusEl.style.color = "blue";
        
        eventSource = new EventSource('/api/sse');

        eventSource.addEventListener('assign-user', (event) => {
            const data = JSON.parse(event.data);
            clientId = data.clientId;
            currentUser = data.user;
            
            console.log(`Assigned as: ${currentUser} (ID: ${clientId})`);
            statusEl.textContent = currentUser 
                ? `Connected as ${currentUser.toUpperCase()} ✅` 
                : "Connected as Spectator 👀";
            statusEl.style.color = currentUser ? 'green' : 'gray';
            
            updateBoxes(data.states);
        });

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateBoxes(data.states);
        };

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error);
            statusEl.textContent = 'Disconnected ❌ (Reconnecting...)';
            statusEl.style.color = 'red';
            setTimeout(connectSSE, 3000);
        };
    }

    function updateBoxes(states) {
        ['row1', 'row2'].forEach(row => {
            const boxes = document.querySelectorAll(`#${row} .box`);
            boxes.forEach((box, index) => {
                box.classList.toggle('active', states[row][index]);
                box.style.cursor = currentUser === row ? 'pointer' : 'not-allowed';
            });
        });
    }

    document.querySelectorAll('.box').forEach(box => {
        box.addEventListener('click', async function() {
            if (!currentUser || currentUser === 'spectator') {
                alert('Please wait for user assignment or refresh the page');
                return;
            }
            
            const row = this.parentElement.id;
            const index = parseInt(this.dataset.index);
            
            if (currentUser !== row) {
                alert(`Only ${row.toUpperCase()} user can control these boxes`);
                return;
            }

            try {
                const response = await fetch('/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ row, index })
                });
                
                if (!response.ok) throw new Error('Update failed');
            } catch (error) {
                console.error('Update error:', error);
                alert('Update failed. Please check console for details.');
            }
        });
    });

    connectSSE();
});