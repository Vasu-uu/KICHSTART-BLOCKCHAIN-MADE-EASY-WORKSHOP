document.addEventListener('DOMContentLoaded', () => {
    const optionsContainer = document.getElementById('optionsContainer');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const voteForm = document.getElementById('voteForm');
    const votedMessage = document.getElementById('votedMessage');
    const pageTitle = document.getElementById('page-title');
    const userInfo = document.getElementById('userInfo');
    const winnerAnnouncment = document.getElementById('winnerAnnouncment'); // Get the new element
    const subtitle = document.querySelector('.subtitle');
    let currentUser = null;

    async function checkSession() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) throw new Error('Session check failed');
            const data = await response.json();
            if (!data.loggedIn) {
                window.location.href = '/login.html';
            } else {
                currentUser = data.user;
                displayUserInfo();
                fetchAndDisplayData();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = '/login.html';
        }
    }

    function displayUserInfo() {
        if (!currentUser) return;
        userInfo.innerHTML = `<p>Welcome, <strong>${currentUser.username}</strong>! <a href="#" id="logoutBtn">Logout</a></p>`;
        document.getElementById('logoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        });
    }

    async function fetchAndDisplayData() {
        try {
            const response = await fetch('/api/results');
            const data = await response.json();

            // Always render the voting options for the form
            optionsContainer.innerHTML = '';
            data.candidates.forEach(candidate => {
                const optionElement = document.createElement('label');
                optionElement.className = 'option';
                optionElement.innerHTML = `<input type="radio" name="candidate" value="${candidate.id}" required> ${candidate.name}`;
                optionsContainer.appendChild(optionElement);
            });

            // Check the election status and decide what to show the user
            if (data.election_status.results_declared) {
                // VOTING HAS ENDED: Show the results
                pageTitle.innerHTML = 'Final Results 🏆';
                subtitle.style.display = 'none';
                voteForm.style.display = 'none';
                resultsSection.style.display = 'block';

                // NEW: Display the winner
                if (data.winner) {
                    winnerAnnouncment.innerHTML = `🎉 Winner: <strong>${data.winner}</strong> 🎉`;
                    winnerAnnouncment.style.display = 'block';
                }

                // Render the results bars with actual vote counts
                if (data.total_votes === 0) {
                    resultsContainer.innerHTML = '<p>No votes were cast in this poll.</p>';
                } else {
                    resultsContainer.innerHTML = ''; // Clear loading message
                    data.candidates.forEach(candidate => {
                        const percentage = (candidate.votes / data.total_votes) * 100 || 0;
                        const resultElement = document.createElement('div');
                        resultElement.className = 'result-item';
                        resultElement.innerHTML = `
                            <div class="result-info">
                                <span>${candidate.name}</span>
                                <span>${candidate.votes} Votes (${Math.round(percentage)}%)</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percentage}%;"></div>
                            </div>`;
                        resultsContainer.appendChild(resultElement);
                    });
                }
            } else {
                // VOTING IS LIVE: Hide results and check if user has voted
                if (data.userHasVoted) {
                    voteForm.style.display = 'none'; // Hide the form
                    votedMessage.style.display = 'block'; // Show the "thank you" message
                    votedMessage.innerHTML = '✅ Your vote has been recorded! Results will be displayed here once the poll is closed by the administrator.';
                }
            }

        } catch (error) {
            console.error("Could not fetch poll data:", error);
            optionsContainer.innerHTML = '<p style="color: red;">Error loading poll data.</p>';
        }
    }

    voteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const selectedOption = document.querySelector('input[name="candidate"]:checked');
        if (!selectedOption) {
            alert('Please select an option to vote!');
            return;
        }

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidate_id: selectedOption.value }),
            });

            const result = await response.json();
            if (response.ok) {
                fetchAndDisplayData();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Could not submit vote:", error);
            alert('An error occurred while submitting your vote.');
        }
    });

    checkSession();
});