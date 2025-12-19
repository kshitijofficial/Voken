import React from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { useState } from 'react';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const InitializeTreasury = ({ walletAddress, idlWithAddress, getProvider }) => {
    const [solPrice, setSolPrice] = useState('');
    const [tokensPerPurchase, setTokensPerPurchase] = useState('');

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const solToLamports = (sol) => {
        return Math.floor(Number(sol) * 1_000_000_000);
    };

    // Convert tokens to raw amount (6 decimals)
    const tokensToRaw = (tokens) => {
        return Math.floor(Number(tokens) * 1_000_000);
    };

    const initializeTreasury = async () => {
       if(!walletAddress){
         alert("Please connect wallet");
         return;
       }
       const provider = getProvider();
       const program = new anchor.Program(idlWithAddress,provider);
       
        let [treasuryConfigPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.TREASURY_CONFIG)],
            program.programId
        );
        let [mintAuthorityPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.MINT_AUTHORITY)],
            program.programId
        );
        let [solVaultPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.SOL_VAULT)],
            program.programId
        );
        let [xMintPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.X_MINT)],
            program.programId
        );
        let [proposalCounterPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode(SEEDS.PROPOSAL_COUNTER)],
            program.programId
        );

        let treasuryTokenAccount = await getAssociatedTokenAddress(xMintPda,
            provider.wallet.publicKey
        )

        console.log(treasuryTokenAccount.toBase58())

       const solLamports = solToLamports(solPrice);
       const tokens = tokensToRaw(tokensPerPurchase);

       const tx = await program.methods.initializeTreasury(
        new anchor.BN(solLamports),new anchor.BN(tokens)).accountsPartial({
            authority: provider.wallet.publicKey,
            treasuryConfig: treasuryConfigPda,
            mintAuthority: mintAuthorityPda,
            solVault: solVaultPda,
            xMint: xMintPda,
            treasuryTokenAccount: treasuryTokenAccount,
            proposalCounter: proposalCounterPda,
       }).rpc();
       console.log("Transcation successful",tx);
    }
    return (
        <div className="card">
            <h2>🏦 Initialize Treasury</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                initializeTreasury();
            }}>
                <input type="number" step="0.001" placeholder="SOL Price (e.g., 1 for 1 SOL)" value={solPrice} onChange={(e) => setSolPrice(e.target.value)} />
                <input type="number" step="0.01" placeholder="Tokens Per Purchase (e.g., 1000)" value={tokensPerPurchase} onChange={(e) => setTokensPerPurchase(e.target.value)} />
                <button type="submit">Initialize Treasury</button>
            </form>
        </div>
    )
}

export default InitializeTreasury;
