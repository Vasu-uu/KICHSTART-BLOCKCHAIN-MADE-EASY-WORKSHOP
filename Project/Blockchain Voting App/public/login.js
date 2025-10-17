document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('message');

  // **CHANGE**: No more special URL for admin. All logins go to the same place.
  const apiBaseUrl = ''; 

  try {
    const response = await fetch(`${apiBaseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      if (data.isAdmin) {
        window.location.href = '/admin.html';
      } else {
        window.location.href = '/index.html';
      }
    } else {
      messageDiv.className = 'message error';
      messageDiv.textContent = data.message || 'Login failed';
    }
  } catch (error) {
    messageDiv.className = 'message error';
    messageDiv.textContent = 'Error connecting to the server.';
  }
});