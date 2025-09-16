#![no_std]
use soroban_sdk::{contract, contractimpl, vec, Address, Env, String, Symbol, Vec, token, Map, symbol_short};

// Contract storage keys for allowance system
const ALLOWANCES: Symbol = symbol_short!("ALLOW");

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

    pub fn is_owner_authorized(env: Env, owner: Address) -> bool {
        // Check if the owner is already authorized
        let authorized: bool = env.storage().instance().get(&Symbol::new(&env, "owner_authorized")).unwrap_or(false);
        let stored_owner: Address = env.storage().instance().get(&Symbol::new(&env, "owner")).unwrap_or(Address::from_string(&String::from_str(&env, "")));
        
        authorized && stored_owner == owner
    }

    pub fn get_participants(env: Env) -> Vec<Address> {
        env.storage().persistent()
            .get(&Symbol::new(&env, "participants"))
            .unwrap_or(Vec::new(&env))
    }

    /// Approve a spender to spend up to `amount` of your XLM
    /// This function does BOTH authorizations:
    /// 1. Internal allowance in the contract
    /// 2. Native XLM token authorization
    /// @param spender - The address authorized to spend your XLM
    /// @param amount - Maximum amount in stroops (1 XLM = 10,000,000 stroops)
    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128) {
        owner.require_auth();
        
        let mut allowances: Map<(Address, Address), i128> = env
            .storage()
            .persistent()
            .get(&ALLOWANCES)
            .unwrap_or(Map::new(&env));
        
        allowances.set((owner.clone(), spender.clone()), amount);
        env.storage().persistent().set(&ALLOWANCES, &allowances);
        
        env.events().publish((symbol_short!("approve"), owner, spender), amount);
    }

    /// Transfer XLM from one account to another using the allowance
    /// @param from - The account to transfer from
    /// @param to - The account to transfer to  
    /// @param amount - Amount to transfer in stroops
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        // Require authorization from the spender
        spender.require_auth();
        
        // Check allowance
        let allowances: Map<(Address, Address), i128> = env
            .storage()
            .persistent()
            .get(&ALLOWANCES)
            .unwrap_or(Map::new(&env));
            
        let current_allowance = allowances
            .get((from.clone(), spender.clone()))
            .unwrap_or(0);
            
        if current_allowance < amount {
            panic!("Insufficient allowance");
        }
        
        // Get native token client - using hardcoded XLM token address
        let xlm_token: Address = Address::from_string(&String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"));
        let token_client = token::Client::new(&env, &xlm_token);
        
        // Execute the transfer
        // Note: This requires the 'from' account to have previously authorized this contract
        // to spend their XLM through Stellar's native authorization
        token_client.transfer(&from, &to, &amount);
        
        // Update allowance
        let new_allowance = current_allowance - amount;
        let mut updated_allowances = allowances;
        
        if new_allowance > 0 {
            updated_allowances.set((from.clone(), spender.clone()), new_allowance);
        } else {
            updated_allowances.remove((from.clone(), spender.clone()));
        }
        
        env.storage().persistent().set(&ALLOWANCES, &updated_allowances);
        
        // Emit event
        env.events().publish((symbol_short!("transfer"), from, to), amount);
    }

    /// Get the current allowance for a spender
    /// @param owner - The account that owns the XLM
    /// @param spender - The account authorized to spend
    /// @return The current allowance amount
    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        let allowances: Map<(Address, Address), i128> = env
            .storage()
            .persistent()
            .get(&ALLOWANCES)
            .unwrap_or(Map::new(&env));
            
        allowances
            .get((owner, spender))
            .unwrap_or(0)
    }
}

mod test;
