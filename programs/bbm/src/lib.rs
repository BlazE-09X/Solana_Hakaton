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
        total_fractions: u64,
        ipfs_proof_hash: String,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        let clock = Clock::get()?;

        asset.name = name;
        asset.price = price;
        asset.owner = ctx.accounts.user.key();
        asset.is_verified = false;
        asset.is_rented = false;
        asset.metadata_uri = metadata_uri;
        asset.total_fractions = total_fractions;
        asset.fractions_minted = 0;
        asset.ipfs_proof_hash = ipfs_proof_hash;
        asset.created_at = clock.unix_timestamp;
        asset.collected_income = 0;
        asset.distributed_income = 0;
        asset.rating = 0;

        // Initialize income pool
        let income_pool = &mut ctx.accounts.income_pool;
        income_pool.asset = asset.key();
        income_pool.total_collected = 0;
        income_pool.distributed = 0;
        income_pool.last_distribution = clock.unix_timestamp;

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

    pub fn mint_fractions(
        ctx: Context<MintFractions>,
        amount: u64,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset;

        require!(
            asset.fractions_minted + amount <= asset.total_fractions,
            ErrorCode::ExcessiveAmount
        );
        require_eq!(asset.owner, ctx.accounts.owner.key(), ErrorCode::Unauthorized);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(),
            MintTo {
                mint: ctx.accounts.fraction_mint.to_account_info(),
                to: ctx.accounts.owner_fraction_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, amount)?;

        asset.fractions_minted = asset.fractions_minted.checked_add(amount).unwrap();

        Ok(())
    }

    pub fn collect_rent_income(
        ctx: Context<CollectRentIncome>,
        amount: u64,
    ) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        let income_pool = &mut ctx.accounts.income_pool;
        let clock = Clock::get()?;

        require_eq!(asset.owner, ctx.accounts.owner.key(), ErrorCode::Unauthorized);
        require!(asset.is_rented, ErrorCode::AssetNotRented);

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.renter.key(),
            &income_pool.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.renter.to_account_info(),
                income_pool.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        asset.collected_income = asset.collected_income.checked_add(amount).unwrap();
        income_pool.total_collected = income_pool.total_collected.checked_add(amount).unwrap();
        income_pool.last_distribution = clock.unix_timestamp;

        Ok(())
    }

    pub fn distribute_income(
        ctx: Context<DistributeIncome>,
    ) -> Result<()> {
        let income_pool = &mut ctx.accounts.income_pool;
        let asset = &mut ctx.accounts.asset;

        require_eq!(asset.owner, ctx.accounts.owner.key(), ErrorCode::Unauthorized);

        let amount_to_distribute = income_pool.total_collected - income_pool.distributed;
        require!(amount_to_distribute > 0, ErrorCode::NoIncomeToDistribute);

        let fraction_owner = &ctx.accounts.fraction_owner;
        let fraction_share = (amount_to_distribute * fraction_owner.fractions_owned) / asset.fractions_minted;

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &income_pool.key(),
            &fraction_owner.owner,
            fraction_share,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                income_pool.to_account_info(),
                ctx.accounts.fraction_owner_key.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        income_pool.distributed = income_pool.distributed.checked_add(fraction_share).unwrap();
        asset.distributed_income = asset.distributed_income.checked_add(fraction_share).unwrap();

        Ok(())
    }

    pub fn buy_fraction(
        ctx: Context<BuyFraction>,
        amount: u64,
        price_per_fraction: u64,
    ) -> Result<()> {
        let fraction_owner = &mut ctx.accounts.fraction_owner;
        let buyer = &ctx.accounts.buyer;

        let total_price = amount.checked_mul(price_per_fraction).unwrap();

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &buyer.key(),
            &fraction_owner.owner,
            total_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.seller_fraction_account.to_account_info(),
                to: ctx.accounts.buyer_fraction_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        fraction_owner.fractions_owned = fraction_owner.fractions_owned.checked_sub(amount).unwrap();

        Ok(())
    }

    pub fn sell_fraction(
        ctx: Context<SellFraction>,
        amount: u64,
        price_per_fraction: u64,
    ) -> Result<()> {
        let fraction_owner = &mut ctx.accounts.fraction_owner;

        let total_price = amount.checked_mul(price_per_fraction).unwrap();

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &fraction_owner.owner,
            total_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.seller_fraction_account.to_account_info(),
                to: ctx.accounts.buyer_fraction_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        fraction_owner.fractions_owned = fraction_owner.fractions_owned.checked_add(amount).unwrap();

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

    pub fn release_asset(ctx: Context<ReleaseAsset>) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        asset.is_rented = false;
        Ok(())
    }

    pub fn verify_asset(ctx: Context<VerifyAsset>) -> Result<()> {
        ctx.accounts.asset.is_verified = true;
        Ok(())
    }

    pub fn rate_asset(ctx: Context<RateAsset>, rating: u8) -> Result<()> {
        require!(rating <= 5, ErrorCode::InvalidRating);
        ctx.accounts.asset.rating = rating;
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
    pub total_fractions: u64,
    pub fractions_minted: u64,
    pub ipfs_proof_hash: String,
    pub created_at: i64,
    pub collected_income: u64,
    pub distributed_income: u64,
    pub rating: u8,
}

#[account]
pub struct IncomePool {
    pub asset: Pubkey,
    pub total_collected: u64,
    pub distributed: u64,
    pub last_distribution: i64,
}

#[account]
pub struct FractionOwner {
    pub asset: Pubkey,
    pub owner: Pubkey,
    pub fractions_owned: u64,
    pub purchase_price: u64,
}

#[derive(Accounts)]
pub struct InitializeAsset<'info> {
    #[account(init, payer = user, space = 8 + 512)]
    pub asset: Account<'info, Asset>,
    #[account(init, payer = user, space = 8 + 200)]
    pub income_pool: Account<'info, IncomePool>,
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
pub struct MintFractions<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub fraction_mint: Account<'info, Mint>,
    #[account(mut)]
    pub owner_fraction_account: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectRentIncome<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub income_pool: Account<'info, IncomePool>,
    #[account(mut)]
    pub renter: Signer<'info>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeIncome<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub income_pool: Account<'info, IncomePool>,
    #[account(mut)]
    pub fraction_owner: Account<'info, FractionOwner>,
    /// CHECK: Receiver of income distribution
    #[account(mut)]
    pub fraction_owner_key: AccountInfo<'info>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyFraction<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub fraction_owner: Account<'info, FractionOwner>,
    #[account(mut)]
    pub seller_fraction_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_fraction_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellFraction<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub fraction_owner: Account<'info, FractionOwner>,
    #[account(mut)]
    pub seller_fraction_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_fraction_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RentAsset<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,

    #[account(mut)]
    pub renter: Signer<'info>,

    /// CHECK: Этот аккаунт получает SOL.
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
pub struct RateAsset<'info> {
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

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Asset not rented")]
    AssetNotRented,
    #[msg("Excessive amount")]
    ExcessiveAmount,
    #[msg("No income to distribute")]
    NoIncomeToDistribute,
    #[msg("Invalid rating")]
    InvalidRating,
}