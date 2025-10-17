let electionData = null;

async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();

    if (!data.success) {
      if (response.status === 401) {
        window.location.href = 'login.html';
        return;
      }
      showMessage('Error loading data', 'error');
      return;
    }

    electionData = data;
    document.getElementById('username').textContent = data.username;
    document.getElementById('address').textContent = data.address;

    renderUI();
  } catch (error) {
    showMessage('Error connecting to server', 'error');
  }
}

function renderUI() {
  const statusDiv = document.getElementById('votingStatus');
  const candidatesSection = document.getElementById('candidatesSection');

  if (electionData.candidates.length === 0) {
    statusDiv.innerHTML = '<div class="message info">No candidates available yet. Please wait for the admin to add candidates.</div>';
    candidatesSection.innerHTML = '';
    return;
  }

  if (electionData.resultsDeclared) {
    statusDiv.innerHTML = '<h2>Election Results <span class="status-badge closed">Closed</span></h2>';
    renderResults();
  } else if (electionData.hasVoted) {
    statusDiv.innerHTML = '<h2>You have already voted <span class="status-badge closed">Voted</span></h2>';
    renderCandidates(false); // Can't vote
  } else {
    statusDiv.innerHTML = '<h2>Cast Your Vote <span class="status-badge open">Open</span></h2>';
    renderCandidates(true); // Can vote
  }
}

function renderCandidates(canVote) {
  const candidatesSection = document.getElementById('candidatesSection');
  let html = '<div class="candidates-list">';

  electionData.candidates.forEach(candidate => {
    html += `
      <div class="candidate-card">
        <div class="candidate-info">
          <h3>${candidate.name}</h3>
          <p>Candidate ID: ${candidate.id}</p>
        </div>
        ${canVote ? `<button class="vote-btn" onclick="vote(${candidate.id})">Vote</button>` : ''}
      </div>
    `;
  });

  html += '</div>';
  candidatesSection.innerHTML = html;
}

function renderResults() {
  const candidatesSection = document.getElementById('candidatesSection');
  
  if (electionData.candidates.length === 0) {
      candidatesSection.innerHTML = '<div class="message info">No candidates were in the election.</div>';
      return;
  }

  const sortedCandidates = [...electionData.candidates].sort((a, b) =>
    parseInt(b.voteCount) - parseInt(a.voteCount)
  );

  const maxVotes = parseInt(sortedCandidates[0].voteCount);
  const winners = sortedCandidates.filter(c => parseInt(c.voteCount) === maxVotes);

  let winnerHtml = '';
  if (maxVotes === 0) {
      winnerHtml = '<div class="message info"><h3>No votes were cast in this election.</h3></div>';
  } else if (winners.length > 1) {
      const winnerNames = winners.map(w => w.name).join(' and ');
      winnerHtml = `<div class="message success"><h3>It's a Tie!</h3><p>${winnerNames} won with ${maxVotes} votes each.</p></div>`;
  } else {
      winnerHtml = `<div class="message success"><h3>🏆 Winner Declared! 🏆</h3><p>${winners[0].name} has won the election with ${maxVotes} votes.</p></div>`;
  }

  let listHtml = '<div class="candidates-list">';
  sortedCandidates.forEach(candidate => {
    listHtml += `
      <div class="candidate-card">
        <div class="candidate-info">
          <h3>${candidate.name}</h3>
          <p>Candidate ID: ${candidate.id}</p>
        </div>
        <div class="vote-count">${candidate.voteCount}</div>
      </div>
    `;
  });
  listHtml += '</div>';

  candidatesSection.innerHTML = winnerHtml + listHtml;
}

async function vote(candidateId) {
  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId })
    });

    const data = await response.json();

    if (data.success) {
      showMessage('Vote cast successfully!', 'success');
      setTimeout(() => loadData(), 2000);
    } else {
      showMessage(data.message || 'Failed to cast vote', 'error');
    }
  } catch (error) {
    showMessage('Error connecting to server', 'error');
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'login.html';
  } catch (error) {
    window.location.href = 'login.html';
  }
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  setTimeout(() => {
    messageDiv.className = '';
    messageDiv.textContent = '';
  }, 5000);
}

loadData();