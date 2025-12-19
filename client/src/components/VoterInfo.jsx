import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { useState, useEffect } from 'react';

const VoterInfo = ({ walletAddress, idlWithAddress, getProvider }) => {
    const [voterData, setVoterData] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);

    const fetchVoterInfo = async () => {
        if (!walletAddress) {
            return;
        }
        const provider = getProvider();
        const program = new anchor.Program(idlWithAddress, provider);

        let [voterPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.VOTER), provider.wallet.publicKey.toBuffer()],
            program.programId
        );

        try {
            const data = await program.account.voter.fetch(voterPda);
            setVoterData(data);
            setIsRegistered(true);
        } catch (err) {
            console.log("Voter not registered");
            setVoterData(null);
            setIsRegistered(false);
        }
    }

    useEffect(() => {
        fetchVoterInfo();
    }, [walletAddress]);

    return (
        <div className="card">
            <h2>📋 Voter Info</h2>
            <div style={{ marginBottom: '1rem' }}>
                <span className={`status-badge ${isRegistered ? 'registered' : 'not-registered'}`}>
                    {isRegistered ? '✓ Registered' : '○ Not Registered'}
                </span>
            </div>
            {isRegistered && voterData && (
                <div className="info-display">
                    <p><span className="info-label">Voter ID:</span> <span className="info-value">{voterData.voterId.toBase58().slice(0, 20)}...</span></p>
                    <p><span className="info-label">Proposal Voted:</span> <span className="info-value highlight">{voterData.proposalVoted === 0 ? "Not voted yet" : voterData.proposalVoted}</span></p>
                </div>
            )}
            <button className="btn-secondary" onClick={fetchVoterInfo} style={{ marginTop: '1rem' }}>Refresh</button>
        </div>
    )
}

export default VoterInfo;
