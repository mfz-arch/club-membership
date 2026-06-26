# 🌟 Web3 Club Hub

**A Decentralized Digital Membership Platform for Student Clubs, built on the Avalanche Blockchain.**

*Submitted for Track 4: Public Good at the Global Web3 Hackathon.*

---

## 📖 Overview

**Web3 Club Hub** solves the problem of disorganized, centralized, and unverifiable club memberships. Instead of relying on paper sign-up sheets or siloed Excel files, this platform allows anyone to deploy a transparent, immutable, and verifiable community directly on the Avalanche blockchain.

With **Web3 Club Hub**, any student or organizer can:
1. **Create a Community:** Deploy a new club with a unique on-chain ID.
2. **Discover Clubs:** Browse a decentralized directory of all active communities.
3. **Join on the Blockchain:** Users connect their Web3 Wallet (Core/MetaMask) to sign an on-chain transaction, permanently recording their membership.
4. **My Communities Dashboard:** A dedicated space where users can view the clubs they have officially joined, verified by the Smart Contract.

---

## 🏗️ System Architecture

The platform is built to be robust, fast, and fully decentralized for membership verification:

1. **The Smart Contract (`ClubHub.sol`):**
   - Deployed on the **Avalanche Fuji Testnet**.
   - Acts as the ultimate source of truth.
   - Manages the creation of new clubs (`createClub`), assigns unique IDs, and tracks the array of members for every specific club.
   
2. **The Frontend (Next.js + Tailwind CSS):**
   - A highly responsive, premium dark-mode interface.
   - Uses `ethers.js` to communicate directly with the Avalanche blockchain, meaning the "Discover" tab fetches data dynamically from the Smart Contract without relying on a centralized backend API.

3. **The Off-Chain Database (Firebase):**
   - Used specifically to store non-critical metadata (like real-world Student IDs or Full Names) to bridge the gap between anonymous wallet addresses and real-world student identities.
   - Designed with a *fail-safe architecture*: If the database is unreachable, the system gracefully falls back to pure on-chain verification, ensuring the app never breaks.

---

## 🚀 Key Features

- **Multi-Club Support:** It’s not just a single club; it’s an entire platform where infinite clubs can be created.
- **Wallet Authentication:** No passwords, no emails. Your Web3 wallet is your identity.
- **On-Chain Verification:** Cryptographic proof that a user is a member of a specific organization.
- **Premium UI/UX:** Smooth animations, glassmorphism design, and an intuitive user flow.

---

## 🛠️ Tech Stack

- **Blockchain:** Avalanche Fuji Testnet
- **Smart Contract:** Solidity
- **Frontend Framework:** Next.js (React)
- **Styling:** Tailwind CSS, Framer Motion, Lucide Icons
- **Web3 Integration:** Ethers.js v6
- **Database:** Firebase Firestore

---

## 🔗 Deployed Links

- **Smart Contract Address (Fuji Testnet):** `0x41657f8E851D5cf17ce6025Ca02dF2b677e3bD45`
- **Smart Contract Verifier:** [Sourcify / Snowtrace]

---

## 💻 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd club-membership
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Test the dApp:**
   - Open [http://localhost:3000](http://localhost:3000)
   - Ensure your MetaMask or Core wallet is set to the **Avalanche Fuji Testnet**.
   - Click "Connect Wallet", create a club, and test the "Join" feature!

---

*Built with ❤️ for the Global Web3 Hackathon.*
