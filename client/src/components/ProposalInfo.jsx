import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { useState } from 'react';

const ProposalInfo = ({ walletAddress, idlWithAddress, getProvider }) => {
    const [proposalId, setProposalId] = useState('');
    const [proposalData, setProposalData] = useState(null);
    const [error, setError] = useState('');

    const fetchProposal = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet");
            return;
        }
        if (!proposalId) {
            alert("Please enter a proposal ID");
            return;
        }
        const provider = getProvider();
        const program = new anchor.Program(idlWithAddress, provider);

        let [proposalPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.PROPOSAL), Buffer.from([Number(proposalId)])],
            program.programId
        );

        try {
            const proposalAccountdata = await program.account.proposal.fetch(proposalPda);
            setProposalData(proposalAccountdata);
            setError('');
        } catch (err) {
            console.log("Proposal not found", err);
            setProposalData(null);
            setError('Proposal not found');
        }
    }

    const formatDeadline = (timestamp) => {
        const date = new Date(timestamp.toNumber() * 1000);
        return date.toLocaleString();
    }

    return (
        <div className="card">
            <h2>🔍 Proposal Info</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                fetchProposal();
            }}>
                <input type="number" placeholder="Proposal ID" value={proposalId} onChange={(e) => setProposalId(e.target.value)} />
                <button type="submit">Fetch Proposal</button>
            </form>
            {error && <p className="error-text">{error}</p>}
            {proposalData && (
                <div className="info-display">
                    <p><span className="info-label">Proposal ID:</span> <span className="info-value highlight">{proposalData.proposalId}</span></p>
                    <p><span className="info-label">Description:</span> <span className="info-value">{proposalData.proposalInfo}</span></p>
                    <p><span className="info-label">Votes:</span> <span className="info-value highlight">{proposalData.numberOfVotes}</span></p>
                    <p><span className="info-label">Deadline:</span> <span className="info-value">{formatDeadline(proposalData.deadline)}</span></p>
                    <p><span className="info-label">Authority:</span> <span className="info-value">{proposalData.authority.toBase58().slice(0, 20)}...</span></p>
                </div>
            )}
        </div>
    )
}

export default ProposalInfo;

