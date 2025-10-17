const express = require('express');
const session = require('express-session');
const path = require('path');
const { Web3 } = require('web3');
require('dotenv').config();

const users = require('./users');
const contractABI = require('./build/contracts/Election.json').abi;

const app = express();
const PORT = 3000;

// --- Web3 & Contract Setup ---
const web3 = new Web3(process.env.GANACHE_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
    console.error("CONTRACT_ADDRESS not found in .env file. Please run 'truffle migrate' and add it.");
    process.exit(1);
}
const electionContract = new web3.eth.Contract(contractABI, contractAddress);

// --- User Initialization ---
async function initializeUsers() {
    const accounts = await web3.eth.getAccounts();
    const userKeys = Object.keys(users);
    if (accounts.length < userKeys.length) {
        console.error("Not enough accounts in Ganache to assign to all users.");
        process.exit(1);
    }
    userKeys.forEach((username, index) => {
        users[username].address = accounts[index];
    });
    console.log("✅ User accounts initialized.");
}
initializeUsers();

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'a-single-strong-secret-for-everyone',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// --- Combined API Endpoints ---

// Login (for both users and admin)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && user.password === password) {
        req.session.user = {
            username: username,
            address: user.address,
            privateKey: user.privateKey
        };
        res.json({ success: true, isAdmin: username === 'admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
        res.json({ success: true });
    });
});

// --- Authentication Middleware ---
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.username !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Generic Data Endpoint (serves both users and admin)
app.get('/api/data', isAuthenticated, async (req, res) => {
    try {
        const candidatesCount = await electionContract.methods.candidatesCount().call();
        const resultsDeclared = await electionContract.methods.resultsDeclared().call();
        const hasVoted = await electionContract.methods.voters(req.session.user.address).call();
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
            hasVoted,
            username: req.session.user.username,
            address: req.session.user.address
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- User-Specific Actions ---
app.post('/api/vote', isAuthenticated, async (req, res) => {
    try {
        const { candidateId } = req.body;
        const receipt = await handleTransaction('vote', [candidateId], req.session);
        res.json({ success: true, receipt: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Admin-Specific Actions ---
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

// **--- THIS IS THE CORRECTED FUNCTION ---**
async function handleTransaction(methodName, args, session) {
    const userAddress = session.user.address;
    const privateKey = session.user.privateKey;
    const method = electionContract.methods[methodName](...args);
    const encodedABI = method.encodeABI();

    // 1. Estimate the gas limit
    const gasEstimate = await method.estimateGas({ from: userAddress });
    
    // 2. **FIX**: Get the current gas price from the network
    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
        from: userAddress,
        to: contractAddress,
        gas: gasEstimate,
        gasPrice: gasPrice, // **FIX**: Add the fetched gasPrice to the transaction
        data: encodedABI
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

app.listen(PORT, () => {
    console.log(`🚀 Unified server running on http://localhost:${PORT}`);
});