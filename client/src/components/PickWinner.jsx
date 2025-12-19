import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { useState } from 'react';

const PickWinner = ({ walletAddress, idlWithAddress, getProvider }) => {
    const [proposalId, setProposalId] = useState('');

    const pickWinner = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet");
            return;
        }
        const provider = getProvider();
        const program = new anchor.Program(idlWithAddress, provider);

        let [proposalAccountPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.PROPOSAL), Buffer.from([Number(proposalId)])],
            program.programId
        );

        const tx = await program.methods.pickWinner(
            Number(proposalId)
        ).accountsPartial({
            proposalAccount: proposalAccountPda,
            signer: provider.wallet.publicKey,
        }).rpc();
        console.log("Transaction successful", tx);
    }
    return (
        <div className="card">
            <h2>🏆 Pick Winner</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                pickWinner();
            }}>
                <input type="number" placeholder="Proposal ID" value={proposalId} onChange={(e) => setProposalId(e.target.value)} />
                <button type="submit">Pick Winner</button>
            </form>
        </div>
    )
}

export default PickWinner;
