// File: server.js
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;
const saltRounds = 10;

// --- Middleware ---
app.set('trust proxy', 1);
app.use(express.json());
app.use(session({
    secret: 'a-very-strong-and-long-secret-key-that-you-should-change',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- Database Connection ---
let db;
async function connectDatabase() {
    try {
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Your MySQL password
            database: 'voting_app_db'
        });
        console.log('Successfully connected to the voting_app_db database.');
    } catch (err) {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1);
    }
}
connectDatabase();

// --- Authentication Middleware ---
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
};

// --- Static File Serving & Page Routing ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

// --- API Endpoints ---

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully! Please log in.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { id: user.id, username: user.username };
            res.json({ message: 'Logged in successfully.' });
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// User Logout
app.post('/api/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully.' });
    });
});

// Check Session Status
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Get Poll Results/Data (for regular users)
app.get('/api/results', async (req, res) => {
    try {
        const [candidates] = await db.query('SELECT id, name, votes FROM candidates ORDER BY id ASC');
        const [[election_status]] = await db.query('SELECT results_declared FROM settings WHERE id = 1');

        let userHasVoted = false;
        if (req.session.user) {
            const [voted] = await db.query('SELECT * FROM voted_users WHERE user_id = ?', [req.session.user.id]);
            userHasVoted = voted.length > 0;
        }

        if (election_status.results_declared) {
            const total_votes = candidates.reduce((sum, c) => sum + c.votes, 0);
            let winner = 'No one';
            if (total_votes > 0) {
                const maxVotes = Math.max(...candidates.map(c => c.votes));
                const winners = candidates.filter(c => c.votes === maxVotes);
                winner = winners.map(w => w.name).join(' & ');
            }

            res.json({
                candidates,
                total_votes,
                election_status,
                userHasVoted,
                winner // NEW: Winner info is included
            });
        } else {
            const candidatesWithoutVotes = candidates.map(({ id, name }) => ({ id, name }));
            res.json({
                candidates: candidatesWithoutVotes,
                total_votes: 0,
                election_status,
                userHasVoted
            });
        }
    } catch (err) {
        console.error("Error fetching results: ", err);
        res.status(500).json({ message: 'Failed to fetch poll results.' });
    }
});

// Post a Vote
app.post('/api/vote', isAuthenticated, async (req, res) => {
    const { candidate_id } = req.body;
    const user_id = req.session.user.id;

    if (!candidate_id) {
        return res.status(400).json({ message: 'Candidate ID is required.' });
    }

    try {
        const [[status]] = await db.query('SELECT results_declared FROM settings WHERE id = 1');
        if (status.results_declared) {
            return res.status(403).json({ message: 'Voting has ended.' });
        }
        const [voted] = await db.query('SELECT * FROM voted_users WHERE user_id = ?', [user_id]);
        if (voted.length > 0) {
            return res.status(403).json({ message: 'You have already voted.' });
        }
        
        await db.beginTransaction();
        await db.query('UPDATE candidates SET votes = votes + 1 WHERE id = ?', [candidate_id]);
        await db.query('INSERT INTO voted_users (user_id) VALUES (?)', [user_id]);
        await db.commit();
        
        res.json({ message: 'Vote cast successfully!' });
    } catch (err) {
        await db.rollback();
        console.error('Error processing vote:', err);
        res.status(500).json({ message: 'Failed to cast vote.' });
    }
});


// --- ADMIN API ENDPOINTS ---

// Get Full Poll Results (for admin panel only)
app.get('/api/admin/results', async (req, res) => {
    try {
        const [candidates] = await db.query('SELECT id, name, votes FROM candidates ORDER BY id ASC');
        const [[election_status]] = await db.query('SELECT results_declared FROM settings WHERE id = 1');
        const total_votes = candidates.reduce((sum, c) => sum + c.votes, 0);

        res.json({
            candidates,
            total_votes,
            election_status
        });
    } catch (err) {
        console.error("Error fetching admin results: ", err);
        res.status(500).json({ message: 'Failed to fetch admin poll results.' });
    }
});

app.post('/api/admin/add_candidate', async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Candidate name is required.' });
    }
    try {
        await db.query('INSERT INTO candidates (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ message: 'Candidate added successfully.' });
    } catch (err) {
        console.error('Error adding candidate:', err);
        res.status(500).json({ message: 'Failed to add candidate.' });
    }
});

app.post('/api/admin/declare_results', async (req, res) => {
    try {
        await db.query('UPDATE settings SET results_declared = 1 WHERE id = 1');
        res.json({ message: 'Results declared successfully.' });
    } catch (err) {
        console.error('Error declaring results:', err);
        res.status(500).json({ message: 'Failed to declare results.' });
    }
});

// UPDATED Reset Endpoint
app.post('/api/admin/reset', async (req, res) => {
    try {
        await db.beginTransaction();
        await db.query('DELETE FROM voted_users');
        await db.query('DELETE FROM candidates'); // NEW: Deletes all candidates
        await db.query('UPDATE settings SET results_declared = 0 WHERE id = 1');
        await db.commit();
        res.json({ message: 'Election reset successfully. All candidates and votes have been cleared.' });
    } catch (err) {
        await db.rollback();
        console.error('Error resetting election:', err);
        res.status(500).json({ message: 'Failed to reset election.' });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Voting app server is running at http://localhost:${port}`);
    console.log(`Admin panel is available at http://localhost:${port}/admin.html`);
});