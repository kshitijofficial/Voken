use anchor_lang::prelude::*;
mod state;
mod contexts;
use contexts::*;
mod errors;
use errors::*;
mod events;
use events::*;
declare_id!("4RjxhJeJM6Umfd6m6i1c1BB3V7UNv39ZyoW6HtPbeU6D");
use anchor_spl::token::{mint_to, transfer, MintTo, Transfer};
use anchor_lang::system_program;

#[program]
pub mod vote_app {
    use super::*;

  pub fn initialize_treasury(
    ctx: Context<InitializeTreasury>,
    sol_price: u64,
    tokens_per_purchase: u64,
) -> Result<()> {
        let treasury_config_account = &mut ctx.accounts.treasury_config_account;
        treasury_config_account.authority = ctx.accounts.authority.key();
        treasury_config_account.bump = ctx.bumps.sol_vault;
        treasury_config_account.sol_price = sol_price;
        treasury_config_account.x_mint = ctx.accounts.x_mint.key();
        treasury_config_account.tokens_per_purchase = tokens_per_purchase;
        treasury_config_account.treasury_token_account = ctx.accounts.treasury_token_account.key();

    emit!(TreasuryInitialized {
        authority: ctx.accounts.authority.key(),
        x_mint: ctx.accounts.x_mint.key(),
        sol_price,
        tokens_per_purchase,
        timestamp: Clock::get()?.unix_timestamp,
    });

    let proposal_counter_account = &mut ctx.accounts.proposal_counter_account;
    require!(
        proposal_counter_account.proposal_count == 0,
        VoteError::ProposalCounterAlreadyInitialized
    );

    proposal_counter_account.proposal_count = 1;
    proposal_counter_account.authority = ctx.accounts.authority.key();

    emit!(ProposalCounterInitialized {
        authority: ctx.accounts.authority.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}


       pub fn buy_tokens(ctx: Context<BuyTokens>) -> Result<()> {
    let treasury_config_account = &ctx.accounts.treasury_config_account;
    let sol = treasury_config_account.sol_price;
    let token_amount = treasury_config_account.tokens_per_purchase;

    // Transfer SOL
    let transfer_ix = system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.sol_vault.to_account_info(),
    };

    system_program::transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_ix),
        sol,
    )?;

    // Mint tokens
    let mint_authority_seeds = &[b"mint_authority".as_ref(), &[ctx.bumps.mint_authority]];
    let signer_seeds = &[&mint_authority_seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.x_mint.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    mint_to(cpi_ctx, token_amount)?;

    emit!(TokensPurchased {
        buyer: ctx.accounts.buyer.key(),
        sol_paid: sol,
        tokens_received: token_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

       pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
    let voter_account = &mut ctx.accounts.voter_account;
    voter_account.voter_id = ctx.accounts.authority.key();

    emit!(VoterRegistered {
        voter: ctx.accounts.authority.key(),
        voter_account: ctx.accounts.voter_account.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

        
        pub fn register_proposal(ctx: Context<RegisterProposal>,proposal_info:String,deadline:i64,token_amount:u64) -> Result<()> {
            
            let clock = Clock::get()?;

            require!(deadline>clock.unix_timestamp,VoteError::InvalidDeadline);

            let proposal_account = &mut ctx.accounts.proposal_account;
            //transfer tokens from proposal_token account to treasury_token_account

            let cpi_accounts = Transfer {
                from:ctx.accounts.proposal_token_account.to_account_info(),
                to:ctx.accounts.treasury_token_account.to_account_info(),
                authority:ctx.accounts.authority.to_account_info()
            };

            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            );
            //transfer of tokens
            transfer(cpi_ctx, token_amount)?;

            proposal_account.proposal_info = proposal_info;
            proposal_account.deadline = deadline;
            proposal_account.authority = ctx.accounts.authority.key();

            let proposal_counter_account = &mut ctx.accounts.proposal_counter_account;
            proposal_account.proposal_id = proposal_counter_account.proposal_count;
            proposal_counter_account.proposal_count= proposal_counter_account.proposal_count.checked_add(1).ok_or(VoteError::ProposalCounterOverflow)?;
            
            emit!(ProposalCreated{
                proposal_id: proposal_account.proposal_id,
                creator:proposal_account.authority ,
                proposal_info: proposal_account.proposal_info.clone(),
                deadline: proposal_account.deadline,
                timestamp: Clock::get()?.unix_timestamp,
            });
            Ok(())
        }

        pub fn proposal_to_vote(
    ctx: Context<Vote>,
    proposal_id: u8,
    token_amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    let proposal_account = &mut ctx.accounts.proposal_account;

    require!(
        proposal_account.deadline > clock.unix_timestamp,
        VoteError::ProposalEnded
    );

    let cpi_accounts = Transfer {
        from: ctx.accounts.voter_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx =
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer(cpi_ctx, token_amount)?;

    let voter_account = &mut ctx.accounts.voter_account;
    voter_account.proposal_voted = proposal_id;

    proposal_account.number_of_votes = proposal_account
        .number_of_votes
        .checked_add(1)
        .ok_or(VoteError::ProposalVotesOverflow)?;

    emit!(VoteCast {
        voter: ctx.accounts.authority.key(),
        proposal_id,
        total_votes: proposal_account.number_of_votes,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}



    pub fn pick_winner(ctx: Context<PickWinner>, proposal_id: u8) -> Result<()> {
    let clock = Clock::get()?;
    let proposal = &ctx.accounts.proposal_account;
    let winner = &mut ctx.accounts.winner_account;

    require!(
        clock.unix_timestamp >= proposal.deadline,
        VoteError::VotingStillActive
    );

    require!(proposal.number_of_votes > 0, VoteError::NoVotesCast);

    if proposal.number_of_votes > winner.winning_votes {
        winner.winning_proposal_id = proposal_id;
        winner.winning_votes = proposal.number_of_votes;
        winner.proposal_info = proposal.proposal_info.clone();
        winner.declared_at = clock.unix_timestamp;

        emit!(WinnerDeclared {
            winning_proposal_id: proposal_id,
            proposal_info: proposal.proposal_info.clone(),
            total_votes: proposal.number_of_votes,
            declared_by: ctx.accounts.authority.key(),
            timestamp: clock.unix_timestamp,
        });
    }

    Ok(())
}



pub fn close_proposal(ctx: Context<CloseProposal>, proposal_id: u8) -> Result<()> {
    let clock = Clock::get()?;
    let proposal = &ctx.accounts.proposal_account;

    require!(
        clock.unix_timestamp >= proposal.deadline,
        VoteError::VotingStillActive
    );

    emit!(ProposalClosed {
        proposal_id,
        rent_recovered: ctx.accounts.proposal_account.to_account_info().lamports(),
        recovered_to: ctx.accounts.authority.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}


    pub fn close_voter(ctx: Context<CloseVoter>) -> Result<()> {
        emit!(VoterAccountClosed {
            voter: ctx.accounts.voter_account.voter_id,
            rent_recovered_to: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        // Account will be closed by the `close` constraint
        Ok(())
    }  

    
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        let treasury_config = &ctx.accounts.treasury_config;

        // Use PDA signing to transfer SOL from vault to authority
        let sol_vault_seeds = &[b"sol_vault".as_ref(), &[treasury_config.bump]];
        let signer_seeds = &[&sol_vault_seeds[..]];

        let transfer_ix = system_program::Transfer {
            from: ctx.accounts.sol_vault.to_account_info(),
            to: ctx.accounts.authority.to_account_info(),
        };

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                transfer_ix,
                signer_seeds,
            ),
            amount,
        )?;

        emit!(SolWithdrawn {
            authority: ctx.accounts.authority.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

}

