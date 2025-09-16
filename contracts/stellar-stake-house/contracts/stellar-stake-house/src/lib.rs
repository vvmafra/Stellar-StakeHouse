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
        // Require owner's authorization first
        owner.require_auth();
    
        let xlm_token: Address = Address::from_string(&String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"));
        
        // Store owner information
        env.storage().instance().set(&Symbol::new(&env, "owner_authorized"), &true);
        env.storage().instance().set(&Symbol::new(&env, "owner"), &owner);
        
        let token_client = token::Client::new(&env, &xlm_token);
        
        // Set amount to 40 XLM (40 * 10^7 stroops) for transfers
        let amount: i128 = 400_000_000;
        let expiration_ledger = env.ledger().sequence() + 17280; // ~24 hours
        
        // Approve the owner to spend tokens FROM this contract
        token_client.approve(
            &env.current_contract_address(),  // from: the contract
            &owner,                           // spender: the owner
            &amount,
            &expiration_ledger
        );
    }


    pub fn is_owner_authorized(env: Env, owner: Address) -> bool {
        // Check if the owner is already authorized
        let authorized: bool = env.storage().instance().get(&Symbol::new(&env, "owner_authorized")).unwrap_or(false);
        let stored_owner: Address = env.storage().instance().get(&Symbol::new(&env, "owner")).unwrap_or(Address::from_string(&String::from_str(&env, "")));
        
        authorized && stored_owner == owner
    }

    pub fn distribute(env: Env) {
        // Iterate over the participants and distribute tokens
    }
}

mod test;
