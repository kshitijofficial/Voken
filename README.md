# Voken - Solana Voting dApp

A decentralized voting application built on Solana using Anchor framework and React.

## Features

- **Token-based Voting**: Buy tokens with SOL and use them to vote on proposals
- **Proposal Management**: Create proposals with deadlines and token stakes
- **Voter Registration**: Register as a voter to participate
- **Winner Selection**: Automatically determine winners after voting ends
- **Treasury System**: Admin-controlled treasury for managing funds

## Tech Stack

- **Smart Contract**: Rust + Anchor Framework
- **Frontend**: React + Vite
- **Blockchain**: Solana (Devnet)

## Project Structure

```
├── vote_app/          # Anchor program (Solana smart contract)
│   └── programs/
│       └── vote_app/
│           └── src/
│               ├── lib.rs        # Main program logic
│               ├── contexts.rs   # Account contexts
│               ├── state.rs      # Account structures
│               ├── errors.rs     # Custom errors
│               └── events.rs     # Program events
├── client/            # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── idl/          # Program IDL
│       └── constants/    # App constants
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI
- Phantom Wallet

### Run the Frontend

```bash
cd client
npm install
npm run dev
```

### Build & Deploy the Program

```bash
cd vote_app
anchor build
anchor deploy
```

## Program Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_treasury` | Set up treasury with token mint and pricing |
| `buy_tokens` | Purchase voting tokens with SOL |
| `register_voter` | Register a voter account |
| `register_proposal` | Create a new proposal with stake |
| `proposal_to_vote` | Cast a vote on a proposal |
| `pick_winner` | Declare winner after deadline |
| `close_proposal` | Close proposal and recover rent |
| `close_voter` | Close voter account and recover rent |
| `withdraw_sol` | Admin withdraws SOL from treasury |

## License

MIT
