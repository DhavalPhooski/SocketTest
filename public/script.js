document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Supabase
  const supabase = supabase.createClient(
    'https://your-project.supabase.co',
    'your-anon-key'
  );

  // 2. Assign user to row
  const currentRow = await assignUserRow(supabase);
  document.getElementById('status').textContent = `You control: ${currentRow}`;
  
  // 3. Set up realtime listener
  supabase.channel('box-updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'box_states'
    }, (payload) => updateBoxes(payload.new))
    .subscribe();

  // 4. Initial load
  const { data } = await supabase.from('box_states').select('*').single();
  updateBoxes(data);

  // 5. Set up click handlers
  document.querySelectorAll('.box').forEach(box => {
    box.addEventListener('click', () => handleBoxClick(supabase, box, currentRow));
  });
});

// Helper functions
async function assignUserRow(supabase) {
  const { data, error } = await supabase.rpc('get_available_row');
  if (error) console.error("Row assignment failed:", error);
  return data || 'row1'; // Default fallback
}

async function handleBoxClick(supabase, box, currentRow) {
  const row = box.parentElement.id;
  const index = parseInt(box.dataset.index);
  
  if (row !== currentRow) {
    alert(`You can only control ${currentRow} boxes!`);
    return;
  }

  const { error } = await supabase.rpc('update_box_state', {
    row_name: row,
    box_index: index
  });
  
  if (error) console.error("Update failed:", error);
}

function updateBoxes(state) {
  ['row1', 'row2'].forEach(row => {
    const boxes = document.querySelectorAll(`#${row} .box`);
    boxes.forEach((box, i) => {
      const isActive = state[row][i];
      box.classList.toggle('active', isActive);
      box.style.cursor = box.parentElement.id === currentRow ? 'pointer' : 'not-allowed';
    });
  });
}