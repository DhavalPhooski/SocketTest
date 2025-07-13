document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    let eventSource;
    let currentUser = null;

    // Initialize SSE connection
    function connectSSE() {
        eventSource = new EventSource('/api/sse');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateBoxes(data.states);
            if (data.user) currentUser = data.user;
            statusEl.textContent = `Connected as ${currentUser || 'User'} ✅`;
            statusEl.style.color = 'green';
        };

        eventSource.onerror = () => {
            statusEl.textContent = 'Disconnected ❌ (Reconnecting...)';
            statusEl.style.color = 'red';
            setTimeout(connectSSE, 3000);
        };
    }

    // Update box states
    function updateBoxes(states) {
        ['row1', 'row2'].forEach(row => {
            const boxes = document.querySelectorAll(`#${row} .box`);
            boxes.forEach((box, index) => {
                box.classList.toggle('active', states[row][index]);
                box.style.cursor = currentUser === row ? 'pointer' : 'not-allowed';
            });
        });
    }

    // Handle box clicks
    document.querySelectorAll('.box').forEach(box => {
        box.addEventListener('click', async () => {
            if (!currentUser) return;
            
            const row = box.parentElement.id;
            const index = parseInt(box.dataset.index);

            if (currentUser !== row) return;

            try {
                await fetch('/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ row, index })
                });
            } catch (error) {
                console.error('Update failed:', error);
            }
        });
    });

    connectSSE();
});