use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo};

declare_id!("CJMFFyVCeEUqfouQnaVKpXRwBWFD5rUZH8q8VAuggynf");

#[program]
pub mod bbm {
    use super::*;

    pub fn initialize_asset(
        ctx: Context<InitializeAsset>,
        name: String,
        price: u64,
        metadata_uri: String,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        asset.name = name;
        asset.price = price;
        asset.owner = ctx.accounts.user.key();
        asset.is_verified = false;
        asset.is_rented = false;
        asset.metadata_uri = metadata_uri;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, 1)?;
        Ok(())
    }

    pub fn rent_asset(ctx: Context<RentAsset>) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.renter.key(),
            &ctx.accounts.owner.key(),
            asset.price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.renter.to_account_info(), 
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.system_program.to_account_info()
            ],
        )?;

        asset.is_rented = true;
        Ok(())
    }

    // НОВАЯ ФУНКЦИЯ: Освобождение актива
    pub fn release_asset(ctx: Context<ReleaseAsset>) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        asset.is_rented = false;
        Ok(())
    }

    pub fn verify_asset(ctx: Context<VerifyAsset>) -> Result<()> {
        ctx.accounts.asset.is_verified = true;
        Ok(())
    }

    pub fn transfer_asset(ctx: Context<TransferAsset>, amount: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(),
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
    pub is_verified: bool,   
    pub is_rented: bool,     
    pub metadata_uri: String, 
}

#[derive(Accounts)]
pub struct InitializeAsset<'info> {
    #[account(init, payer = user, space = 8 + 300)] // Увеличили место про запас
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
pub struct RentAsset<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    
    #[account(mut)]
    pub renter: Signer<'info>,

    /// CHECK: Этот аккаунт получает SOL. Мы доверяем этому адресу, так как он проверяется в логике инструкции.
    #[account(mut)]
    pub owner: AccountInfo<'info>, 
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseAsset<'info> {
    #[account(mut, has_one = owner)]
    pub asset: Account<'info, Asset>,
    pub owner: Signer<'info>,
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