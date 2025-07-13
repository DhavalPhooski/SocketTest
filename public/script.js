// Initialize Supabase
const supabase = supabase.createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

let currentRow = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Assign user to a row
  currentRow = await assignUserRow();
  document.getElementById('status').textContent = `You control: ${currentRow}`;
  
  // Listen for changes
  supabase.channel('box-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'box_states'
    }, (payload) => {
      updateBoxes(payload.new);
    })
    .subscribe();

  // Initial load
  const { data } = await supabase.from('box_states').select('*').single();
  updateBoxes(data);

  // Set up click handlers
  document.querySelectorAll('.box').forEach(box => {
    box.addEventListener('click', () => handleBoxClick(box));
  });
});

async function assignUserRow() {
  const { data } = await supabase.rpc('get_available_row');
  return data; // Returns 'row1' or 'row2'
}

async function handleBoxClick(box) {
  const row = box.parentElement.id;
  const index = parseInt(box.dataset.index);
  
  if (row !== currentRow) {
    alert(`You can only control ${currentRow} boxes!`);
    return;
  }

  await supabase.rpc('update_box_state', {
    row_name: row,
    box_index: index
  });
}

function updateBoxes(state) {
  ['row1', 'row2'].forEach(row => {
    const boxes = document.querySelectorAll(`#${row} .box`);
    boxes.forEach((box, i) => {
      box.classList.toggle('active', state[row][i]);
      box.style.cursor = (row === currentRow) ? 'pointer' : 'not-allowed';
    });
  });
}