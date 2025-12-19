import React, { useState } from 'react'
import { SEEDS } from '../constants/constants';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

const BuyTokens = ({ walletAddress, idlWithAddress, getProvider, connection }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const buyTokens = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet");
            return;
        }

        setLoading(true);
        setStatus('Preparing transaction...');

        try {

            const provider = getProvider();
            const program = new anchor.Program(idlWithAddress, provider);

            let [xMintPda] = PublicKey.findProgramAddressSync(
                [new TextEncoder().encode(SEEDS.X_MINT)],
                program.programId
            );

            const buyerTokenAccount = await getAssociatedTokenAddress(
                        xMintPda,
                        provider.wallet.publicKey
            );
            // Build a single transaction with all necessary instructions
            const transaction  = new Transaction();


            const [treasuryConfigPda] = PublicKey.findProgramAddressSync(
                    [new TextEncoder().encode(SEEDS.TREASURY_CONFIG)],
                    program.programId
                );

            const treasuryAccountData = await program.account.treasuryConfig.fetch(treasuryConfigPda);
           
            const accountInfo = await connection.getAccountInfo(buyerTokenAccount);
            // Check if ATA exists, if not add creation instruction
            if(!accountInfo){
                 const createAtaTx = createAssociatedTokenAccountInstruction(
                 provider.wallet.publicKey,
                 buyerTokenAccount,
                 provider.wallet.publicKey,
                 xMintPda
            );
            transaction.add(createAtaTx);
            }
            // Add buy tokens instruction
            setStatus('Building buy tokens instruction...');
           
            const buyTokenTx = await program.methods.buyTokens().accountsPartial({
                buyer: provider.wallet.publicKey,
                buyerTokenAccount: buyerTokenAccount,
                xMint: xMintPda,
                treasuryTokenAccount:treasuryAccountData.treasuryTokenAccount
            }).instruction();

            transaction.add(buyTokenTx);
            // Send single transaction with all instructions
            setStatus('Please approve the transaction...');
            const tx = await provider.sendAndConfirm(transaction);
            console.log("Transaction successful", tx);
            setStatus('✅ Tokens purchased successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setStatus(''), 3000);
        } catch (err) {
            console.error("Error buying tokens:", err);
            if (err.message?.includes('User rejected')) {
                setStatus('❌ Transaction cancelled by user');
            } else {
                setStatus(`❌ Error: ${err.message || 'Transaction failed'}`);
            }
            // Clear error message after 5 seconds
            setTimeout(() => setStatus(''), 5000);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="card">
            <h2>💰 Buy Tokens</h2>
            <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Purchase voting tokens to participate in proposals
            </p>
            <button onClick={buyTokens} disabled={loading}>
                {loading ? 'Processing...' : 'Buy Tokens'}
            </button>
            {status && (
                <p style={{
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    color: status.includes('✅') ? '#48bb78' : status.includes('❌') ? '#fc8181' : '#a0aec0'
                }}>
                    {status}
                </p>
            )}
        </div>
    )
}

export default BuyTokens;
