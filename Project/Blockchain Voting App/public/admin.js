// **CHANGE**: No more special URL for admin. All API calls go to the same place.
const ADMIN_API_BASE_URL = ''; 
let electionData = null;

async function loadData() {
  try {
    // **CHANGE**: No more 'credentials: include' needed, as it's the same origin.
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/data`); 

    if (!response.ok) {
      // If not authenticated, redirect to login
      window.location.href = '/login.html';
      return;
    }

    const data = await response.json();

    if (data.success) {
        electionData = data;
        document.getElementById('username').textContent = data.username;
        document.getElementById('address').textContent = data.address;
        renderUI();
    } else {
        window.location.href = '/login.html';
    }
  } catch (error) {
    showMessage('Error connecting to the server.', 'error');
  }
}

// All other functions in this file remain the same, but the 'credentials: include'
// is no longer necessary, though leaving it in won't cause harm.

function renderUI() {
  const statusSpan = document.getElementById('electionStatus');
  const candidatesList = document.getElementById('candidatesList');
  const declareBtn = document.getElementById('declareBtn');
  if (electionData.resultsDeclared) {
    statusSpan.innerHTML = '<span class="status-badge closed">Results Declared</span>';
    declareBtn.disabled = true;
  } else {
    statusSpan.innerHTML = '<span class="status-badge open">Voting Open</span>';
    declareBtn.disabled = false;
  }
  if (electionData.candidates.length === 0) {
    candidatesList.innerHTML = '<div class="message info">No candidates added yet.</div>';
    return;
  }
  let html = '<div class="candidates-list">';
  electionData.candidates.forEach(candidate => {
    html += `<div class="candidate-card"><div class="candidate-info"><h3>${candidate.name}</h3><p>Candidate ID: ${candidate.id}</p></div><div class="vote-count">${candidate.voteCount}</div></div>`;
  });
  html += '</div>';
  candidatesList.innerHTML = html;
}

async function handleAdminAction(endpoint, body = null, confirmMsg) {
  if (confirmMsg && !confirm(confirmMsg)) return;
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    };
    const response = await fetch(`${ADMIN_API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (data.success) {
      showMessage(`Action successful!`, 'success');
      setTimeout(() => loadData(), 1500);
      return true;
    } else {
      showMessage(data.message || 'Action failed', 'error');
      return false;
    }
  } catch (error) {
    showMessage('Error connecting to server', 'error');
    return false;
  }
}

document.getElementById('addCandidateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('candidateName');
  const name = nameInput.value;
  if (!name || name.trim() === "") return;
  const success = await handleAdminAction('/api/admin/add_candidate', { name });
  if (success) nameInput.value = '';
});

async function declareResults() { await handleAdminAction('/api/admin/declare_results', null, 'Are you sure?'); }
async function resetElection() { await handleAdminAction('/api/admin/reset', null, 'Are you sure?'); }
async function logout() {
  await fetch(`${ADMIN_API_BASE_URL}/api/logout`, { method: 'POST' });
  window.location.href = '/login.html';
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  setTimeout(() => { messageDiv.className = ''; messageDiv.textContent = ''; }, 4000);
}

loadData();