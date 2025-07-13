// Initialize Supabase
const supabaseUrl = 'https://nqssnsqcqjxqjnytzxus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc3Nuc3FjcWp4cWpueXR6eHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzYwNjYsImV4cCI6MjA2ODAxMjA2Nn0.n0ut8CyAWl4kSdRA3o8ANk9itGqAdoB12rjL2GX5RRs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let myRow = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check for existing user session
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user.id || crypto.randomUUID();
  
  // Assign row based on first-come-first-serve
  myRow = await assignUserRow();
  
  // Setup realtime subscription
  const channel = supabase.channel('box_updates')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'box_states' },
      handleStateUpdate
    )
    .subscribe();

  // Initial load
  const { data } = await supabase.from('box_states').select('*').single();
  updateBoxes(data);
  
  // Set up box click handlers
  document.querySelectorAll('.box').forEach(box => {
    box.addEventListener('click', () => handleBoxClick(box));
  });
});

// Helper functions
async function assignUserRow() {
  const { data } = await supabase.rpc('get_available_row');
  document.getElementById('status').textContent = `You control: ${data.toUpperCase()}`;
  return data;
}

async function handleBoxClick(box) {
  const row = box.parentElement.id;
  const index = box.dataset.index;
  
  if (row !== myRow) {
    alert(`Only ${myRow} user can control these boxes`);
    return;
  }

  const { data } = await supabase.rpc('update_box_state', {
    row_name: row,
    box_index: parseInt(index)
  });
}

function handleStateUpdate(payload) {
  updateBoxes(payload.new);
}

function updateBoxes(state) {
  ['row1', 'row2'].forEach(row => {
    const boxes = document.querySelectorAll(`#${row} .box`);
    boxes.forEach((box, i) => {
      box.classList.toggle('active', state[row][i]);
      box.style.cursor = (row === myRow) ? 'pointer' : 'not-allowed';
    });
  });
}