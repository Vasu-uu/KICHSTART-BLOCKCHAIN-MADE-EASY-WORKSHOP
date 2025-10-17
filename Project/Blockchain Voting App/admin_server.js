const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cors = require('cors');
const { Web3 } = require('web3');
require('dotenv').config();

const users = require('./users');
const contractABI = require('./build/contracts/Election.json').abi;

const app = express();
const ADMIN_PORT = 3001;
const USER_APP_URL = 'http://localhost:3000';

// --- Web3 & Contract Setup ---
const web3 = new Web3(process.env.GANACHE_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not found in .env file. Please run 'truffle migrate' and add it.");
    process.exit(1);
}
const electionContract = new web3.eth.Contract(contractABI, contractAddress);

// --- Initialize Admin User ---
async function initializeAdmin() {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        users.admin.address = accounts[0];
        console.log(`Admin assigned address: ${users.admin.address}`);
    } else {
        console.error("No accounts found in Ganache. Cannot assign address to admin.");
        process.exit(1);
    }
}

initializeAdmin();

// --- Middleware ---
app.use(cors({
    origin: USER_APP_URL,
    credentials: true
}));
app.use(express.json());

const sessionStore = new FileStore({
    path: './.sessions',
    ttl: 86400,
    logFn: function() {}
});

app.use(session({
    store: sessionStore,
    name: 'admin.sid',
    secret: 'a-very-strong-admin-secret-key-that-is-long',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if on HTTPS
        httpOnly: true,
        // **CRITICAL CHANGES FOR CROSS-SITE COOKIES**
        // 'lax' is the best option for local development across different ports.
        sameSite: 'lax',
        // Explicitly set the domain. This helps browsers treat different ports on localhost as the same site.
        domain: 'localhost'
    }
}));


// --- API Endpoints ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = users.admin;

    if (username === 'admin' && adminUser.password === password) {
        req.session.user = {
            username: 'admin',
            address: adminUser.address,
            privateKey: adminUser.privateKey
        };
        // This callback ensures the session is saved before the response is sent.
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Session save error' });
            }
            res.json({ success: true, isAdmin: true });
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.username === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required. Please log in.' });
};

app.get('/api/data', isAdmin, async (req, res) => {
    try {
        const candidatesCount = await electionContract.methods.candidatesCount().call();
        const resultsDeclared = await electionContract.methods.resultsDeclared().call();
        const candidatesList = [];
        for (let i = 1; i <= candidatesCount; i++) {
            const candidate = await electionContract.methods.candidates(i).call();
            candidatesList.push({
                id: candidate.id.toString(),
                name: candidate.name,
                voteCount: candidate.voteCount.toString()
            });
        }
        res.json({
            success: true,
            candidates: candidatesList,
            resultsDeclared,
            username: req.session.user.username,
            address: req.session.user.address
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Other admin routes (add_candidate, declare_results, reset, logout) ---
async function handleTransaction(methodName, args, session) {
    const userAddress = session.user.address;
    const privateKey = session.user.privateKey;
    const method = electionContract.methods[methodName](...args);
    const encodedABI = method.encodeABI();
    const gasEstimate = await method.estimateGas({ from: userAddress });
    const tx = { from: userAddress, to: contractAddress, gas: gasEstimate, data: encodedABI };
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

app.post('/api/admin/add_candidate', isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const receipt = await handleTransaction('addCandidate', [name], req.session);
        res.json({ success: true, receipt: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/admin/declare_results', isAdmin, async (req, res) => {
    try {
        const receipt = await handleTransaction('declareResults', [], req.session);
        res.json({ success: true, receipt: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/admin/reset', isAdmin, async (req, res) => {
    try {
        const receipt = await handleTransaction('resetElection', [], req.session);
        res.json({ success: true, receipt: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('admin.sid', { domain: 'localhost' }); // Ensure cookie is cleared for the right domain
        res.json({ success: true });
    });
});
// --- End of other admin routes ---

app.listen(ADMIN_PORT, () => {
    console.log(`🔐 Admin server running on http://localhost:${ADMIN_PORT}`);
});