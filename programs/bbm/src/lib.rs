use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo};

declare_id!("EGW1GweVgm4BgdKZvR7a9VAJGbwmf3kQPXU71n6MQ3v5");

#[program]
pub mod bbm {
    use super::*;

    pub fn initialize_asset(
        ctx: Context<InitializeAsset>,
        name: String,
        price: u64,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        asset.name = name;
        asset.price = price;
        asset.owner = ctx.accounts.user.key();
        asset.verified = false;
        asset.mint = ctx.accounts.mint.key();

        // Mint 1 token to user
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(), // <- обязательно .key()
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, 1)?;

        Ok(())
    }

    pub fn verify_asset(ctx: Context<VerifyAsset>) -> Result<()> {
        ctx.accounts.asset.verified = true;
        Ok(())
    }

    pub fn transfer_asset(ctx: Context<TransferAsset>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(), // <- обязательно .key()
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[account]
pub struct Asset {
    pub name: String,
    pub price: u64,
    pub owner: Pubkey,
    pub verified: bool,
    pub mint: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeAsset<'info> {
    #[account(init, payer = user, space = 8 + 36 + 8 + 32 + 1 + 32)]
    pub asset: Account<'info, Asset>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyAsset<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAsset<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}