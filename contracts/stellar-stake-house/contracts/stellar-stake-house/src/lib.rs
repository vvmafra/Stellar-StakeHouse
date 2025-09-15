#![no_std]
use soroban_sdk::{contract, contractimpl, vec, Address, Env, String, Symbol, Vec, token};

#[contract]
pub struct Contract;

// This is a sample contract. Replace this placeholder with your own contract logic.
// A corresponding test example is available in `test.rs`.
//
// For comprehensive examples, visit <https://github.com/stellar/soroban-examples>.
// The repository includes use cases for the Stellar ecosystem, such as data storage on
// the blockchain, token swaps, liquidity pools, and more.
//
// Refer to the official documentation:
// <https://developers.stellar.org/docs/build/smart-contracts/overview>.
#[contractimpl]
impl Contract {
    pub fn hello(env: Env, to: String) -> Vec<String> {
        vec![&env, String::from_str(&env, "Hello"), to]
    }
    pub fn join(env: Env, user: Address) {
        // Add the user to the list of participants
        let key = Symbol::new(&env, "participants");
        let mut participants: Vec<Address> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        participants.push_back(user);
        env.storage().persistent().set(&key, &participants);
    }

    pub fn authorize_owner(env: Env, owner: Address) {
        // Hardcoded XLM token address for testnet
        let xlm_token: Address = Address::from_string(&String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"));
        
        // Require owner's authorization
        owner.require_auth();
        
        // Create XLM token client
        let token_client = token::Client::new(&env, &xlm_token);
        
        // Authorize the owner to move tokens on behalf of this contract
        // Set amount to 40 XLM (40 * 10^7 stroops) for transfers
        let amount: i128 = 400_000_000;
        let expiration_ledger = env.ledger().sequence() + 17280; // ~24 hours
        
        token_client.approve(
            &owner,
            &env.current_contract_address(),
            &amount,
            &expiration_ledger
        );
        
        // Mark owner as authorized
        env.storage().instance().set(&Symbol::new(&env, "owner_authorized"), &true);
    }


    pub fn distribute(env: Env) {
        // Iterate over the participants and distribute tokens
    }
}

mod test;
