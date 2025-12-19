import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { useState } from 'react';

const WithdrawSol = ({ walletAddress, idlWithAddress, getProvider }) => {
    const [amount, setAmount] = useState('');

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const solToLamports = (sol) => {
        return Math.floor(Number(sol) * 1_000_000_000);
    };

    const withdrawSol = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet");
            return;
        }
        const provider = getProvider();
        const program = new anchor.Program(idlWithAddress, provider);

        const amountLamports = solToLamports(amount);

        const tx = await program.methods.withdrawSol(
            new anchor.BN(amountLamports)
        ).accountsPartial({
            authority: provider.wallet.publicKey,
        }).rpc();
        console.log("Transaction successful", tx);
    }
    return (
        <div className="card">
            <h2>💸 Withdraw SOL</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                withdrawSol();
            }}>
                <input type="number" step="0.001" placeholder="Amount in SOL (e.g., 1.5)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button type="submit">Withdraw SOL</button>
            </form>
        </div>
    )
}

export default WithdrawSol;
