// File: public/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('resultsContainer');
    const addCandidateForm = document.getElementById('addCandidateForm');
    const candidateNameInput = document.getElementById('candidateName');
    const declareResultsBtn = document.getElementById('declareResultsBtn');
    const resetElectionBtn = document.getElementById('resetElectionBtn');

    /**
     * Fetches and displays the current poll results from the admin endpoint.
     */
    async function fetchAndDisplayResults() {
        try {
            // UPDATED: Fetching from the new admin-specific endpoint
            const response = await fetch('/api/admin/results'); 
            const data = await response.json();

            resultsContainer.innerHTML = ''; // Clear previous results

            if (data.election_status.results_declared) {
                declareResultsBtn.textContent = 'Results Already Declared';
                declareResultsBtn.disabled = true;
            } else {
                declareResultsBtn.textContent = 'Declare Final Results';
                declareResultsBtn.disabled = false;
            }

            if (data.candidates.length === 0) {
                resultsContainer.innerHTML = '<p>No candidates have been added yet.</p>';
                return;
            }

            if (data.total_votes === 0) {
                resultsContainer.innerHTML = '<p>No votes have been cast yet.</p>';
                // Still show candidates with 0 votes
                data.candidates.forEach(candidate => {
                    const resultElement = document.createElement('div');
                    resultElement.className = 'result-item';
                    resultElement.innerHTML = `
                        <div class="result-info">
                            <span>${candidate.name} (ID: ${candidate.id})</span>
                            <span>0 Votes (0%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" style="width: 0%;"></div>
                        </div>
                    `;
                    resultsContainer.appendChild(resultElement);
                });
                return;
            }

            data.candidates.forEach(candidate => {
                const percentage = (candidate.votes / data.total_votes) * 100;
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.innerHTML = `
                    <div class="result-info">
                        <span>${candidate.name} (ID: ${candidate.id})</span>
                        <span>${candidate.votes} Votes (${Math.round(percentage)}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentage}%;"></div>
                    </div>
                `;
                resultsContainer.appendChild(resultElement);
            });
        } catch (error) {
            console.error('Error fetching results:', error);
            resultsContainer.innerHTML = '<p style="color: red;">Could not load results.</p>';
        }
    }

    /**
     * Handles the submission of the 'add candidate' form.
     */
    addCandidateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = candidateNameInput.value.trim();
        if (!name) {
            alert('Please enter a candidate name.');
            return;
        }

        try {
            const response = await fetch('/api/admin/add_candidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                alert('Candidate added successfully!');
                candidateNameInput.value = ''; // Clear input field
                fetchAndDisplayResults(); // Refresh the results
            } else {
                const result = await response.json();
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding candidate:', error);
            alert('An error occurred while adding the candidate.');
        }
    });

    /**
     * Handles the 'Declare Results' button click.
     */
    declareResultsBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to declare the final results? This will end the voting.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/declare_results', { method: 'POST' });
            if (response.ok) {
                alert('Results have been declared! Voting is now closed.');
                fetchAndDisplayResults(); // Refresh UI
            } else {
                const result = await response.json();
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error declaring results:', error);
        }
    });

    /**
     * Handles the 'Reset Election' button click.
     */
    resetElectionBtn.addEventListener('click', async () => {
        if (!confirm('WARNING: This will delete all votes and voted user records. Are you absolutely sure?')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/reset', { method: 'POST' });
            if (response.ok) {
                alert('The election has been reset successfully.');
                fetchAndDisplayResults(); // Refresh UI
            } else {
                const result = await response.json();
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error resetting election:', error);
        }
    });

    // Initial fetch of results when the page loads
    fetchAndDisplayResults();
});