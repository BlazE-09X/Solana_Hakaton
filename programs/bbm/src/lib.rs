use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZp1wqJ7Yw5h9G8K1XKz6h");

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
        asset.owner = *ctx.accounts.user.key;
        asset.verified = false;
        Ok(())
    }

    pub fn verify_asset(ctx: Context<VerifyAsset>) -> Result<()> {
        let asset = &mut ctx.accounts.asset;
        asset.verified = true;
        Ok(())
    }
}

#[account]
pub struct Asset {
    pub name: String,
    pub price: u64,
    pub owner: Pubkey,
    pub verified: bool,
    pub mint: Pubkey, // новый SPL токен, связанный с активом
}

#[derive(Accounts)]
pub struct InitializeAsset<'info> {
    #[account(init, payer = user, space = 8 + 128)]
    pub asset: Account<'info, Asset>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyAsset<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
}