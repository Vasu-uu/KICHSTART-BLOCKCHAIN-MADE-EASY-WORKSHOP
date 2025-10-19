# **🗳️ Database & Blockchain Voting Application**

A dual voting system project featuring both a **Database-based Voting** application for traditional, centralized voting and a **Blockchain-based Voting** application for a secure, transparent, and decentralized alternative.

## **🛠️ Prerequisites & Tools**

Both projects are built on Node.js. The blockchain application requires additional tools to build, deploy, and interact with smart contracts.

* **Node.js**: Ensure you have Node.js installed to run both servers.  
* **Ganache**: A personal blockchain for Ethereum development. You'll run this locally to simulate a live blockchain environment. Download here: [https://archive.trufflesuite.com/ganache/](https://archive.trufflesuite.com/ganache/)  
* **Truffle**: A development framework used to compile and deploy (migrate) your smart contract to the local Ganache blockchain from your terminal. The steps in this guide use Truffle for deployment. Install it globally by running:  
  npm install \-g truffle

* **MetaMask**: A browser extension that works as a crypto wallet and allows the web application to communicate with the blockchain. Get it here: [https://metamask.io/](https://metamask.io/)  
* **Remix IDE (Alternative for development)**: While this project uses a local setup with Truffle, Remix is an excellent browser-based alternative for writing, debugging, and deploying smart contracts, especially for quick tests. Visit: [https://remix.ethereum.org/](https://remix.ethereum.org/)

## **🗃️ Database Voting App**

A traditional web application for voting with user authentication and data storage in a central database.

### **🚀 Steps to Run the Application**

1️⃣ Install Dependencies  
Open your terminal inside the database-voting-app folder and run:  
npm install

2️⃣ Update Database Password  
Open the server.js file and update your database password and other credentials in the configuration section to match your local database setup.  

3️⃣ Start the Application  
Run the following command:  
npm start

4️⃣ Open in Browser  
Visit 👉 http://localhost:3001 to access the application. (Note: Port is 3001 to avoid conflict with the blockchain app).

### **🧠 Notes for Database App**

* Ensure your MySQL service is running before starting the server.  
* Update the necessary database credentials in server.js:  
  * host  
  * user  
  * password  
  * database name  
* You can create a .env file for better security if you prefer.

## **🧱 Blockchain Voting App**

A decentralized application (DApp) that leverages a smart contract on a local blockchain to ensure a secure and transparent voting process.

### **🚀 Steps to Run the Application**

1️⃣ Install Dependencies  
Open your terminal in the blockchain-voting-app folder and run:  
npm install

2️⃣ Start Ganache  
Open the Ganache application to start your local blockchain instance. Make sure it's running on the default RPC server (e.g., http://127.0.0.1:7545).  

3️⃣ Compile the Smart Contract  
Compile your Solidity code into a JSON artifact by running:  
truffle compile

4️⃣ Deploy the Smart Contract  
Deploy the compiled contract to your running Ganache instance:  
truffle migrate \--network development

After it finishes, copy the contract address shown in the terminal.

5️⃣ Create and Configure .env File  
Create a file named .env in the root of the blockchain-voting-app folder. Copy the content from the section below and fill in your contract address and private keys from Ganache.  

6️⃣ Start the Server  
Run the following command to start your application:  
node server.js

7️⃣ Open in Browser  
Navigate to 👉 http://localhost:3000

### **🧩 .env File Content**

Create a file named .env in the blockchain-voting-app directory and paste the following content. Replace the placeholders with your actual details from Ganache.

\# Ganache RPC Server URL (usually the default)  
GANACHE_URL="http://127.0.0.1:7545"

\# Paste the contract address from the 'truffle migrate' step  
CONTRACT_ADDRESS="Paste the address Here."

\# Copy the private key for the admin account from Ganache  
ADMIN_PRIVATE_KEY="Paste the private key for admin here."
USER1_PRIVATE_KEY="Paste user 1 private key here."
USER2_PRIVATE_KEY="Paste user 2 private key here."
USER3_PRIVATE_KEY="Paste user 3 private key here."
USER4_PRIVATE_KEY="Paste user 4 private key here."
USER5_PRIVATE_KEY="Paste user 5 private key here."

### **🧠 Notes for Blockchain App**

* Ensure Ganache is running before deploying or starting the server.  
* If you modify the Solidity contract, you must re-compile and re-deploy:  
  truffle compile  
  truffle migrate \--reset

* Keep your private keys safe—never expose them in public repositories. Using a .env file helps protect them.

## **🪙 Tech Stack**

### **Database Voting App**

* **Backend**: Node.js, Express.js  
* **Database**: MySQL  
* **Frontend**: HTML, CSS, JavaScript

### **Blockchain Voting App**

* **Blockchain**: Solidity, Ganache  
* **Framework**: Truffle  
* **Backend**: Node.js, Express.js  
* **Libraries**: Web3.js  
* **Frontend**: HTML, CSS, JavaScript

## **👨‍💻 Developed by**

Vasudev V  
B.Tech Computer Science | Blockchain & AI Enthusiast
