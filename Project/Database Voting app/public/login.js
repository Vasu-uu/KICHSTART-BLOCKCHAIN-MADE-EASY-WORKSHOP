document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    // Event listener for the "Register here" link
    showRegister.addEventListener('click', (event) => {
        event.preventDefault(); 
        loginView.style.display = 'none'; 
        registerView.style.display = 'block'; 
    });

    // Event listener for the "Login here" link
    showLogin.addEventListener('click', (event) => {
        event.preventDefault(); 
        registerView.style.display = 'none'; 
        loginView.style.display = 'block'; 
    });

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                window.location.href = '/'; 
            } else {
                const result = await response.json();
                alert(`Login Failed: ${result.message}`);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });

    // Registration form handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                loginForm.reset();
                registerForm.reset();
                showLogin.click(); 
            } else {
                alert(`Registration Failed: ${result.message}`);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });
});