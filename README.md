## 🚀 Steps to Run the Application
1️⃣ **Install Dependencies**  
Open your terminal in the project folder and run:
```bash
npm install
```
2️⃣ **Start Ganache**  
Open the **Ganache** application to start your local blockchain.
3️⃣ **Compile the Smart Contract**  
Compile your Solidity code into a JSON artifact by running:
```bash
truffle compile
```
4️⃣ **Deploy the Smart Contract**  
Deploy the compiled contract to your running Ganache instance:
```bash
truffle migrate --network development
```
After it finishes, **copy the contract address** shown in the terminal.
5️⃣ **Create and Configure `.env` File**  
Create a file named `.env` in the root of the project. Copy the content from the section below and fill in your **contract address** and **private keys** from Ganache.
6️⃣ **Start the Server**  
Run the final command to start your application:
```bash
node server.js
```
7️⃣ **Open in Browser**  
Navigate to 👉 [http://localhost:3000](http://localhost:3000)

---

## 🧩 `.env` File Content
Create a file named `.env` and paste the following content into it. Replace the placeholders with your actual details.
```bash
# Ganache RPC Server URL (usually the default)
GANACHE_URL=http://127.0.0.1:7545

# Paste the contract address from the 'truffle migrate' step
CONTRACT_ADDRESS=PASTE_YOUR_CONTRACT_ADDRESS_HERE

# Copy the private keys for the first 9 accounts from Ganache
ADMIN_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_1
USER1_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_2
USER2_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_3
USER3_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_4
USER4_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_5
USER5_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_6
USER6_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_7
USER7_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_8
USER8_PRIVATE_KEY=PASTE_PRIVATE_KEY_OF_ACCOUNT_9
```
