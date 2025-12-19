import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";

const RegisterVoter = ({ walletAddress, idlWithAddress, getProvider }) => {
    const registerVoter = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet");
            return;
        }
        const provider = getProvider();
        const program = new anchor.Program(idlWithAddress, provider);

        const tx = await program.methods.registerVoter()
            .accountsPartial({
                signer: provider.wallet.publicKey,
            }).rpc();
        console.log("Transaction successful", tx);
    }
    return (
        <div className="card">
            <h2>✍️ Register as Voter</h2>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Register your wallet to participate in voting
            </p>
            <button onClick={registerVoter}>Register Voter</button>
        </div>
    )
}

export default RegisterVoter;
