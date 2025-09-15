#![no_std]
use soroban_sdk::{contract, contractimpl, vec, Address, Env, String, Symbol, Vec,};

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

    pub fn authorize_owner(env: Env, owner: Address, token: Address) {
        // Save the authorization to move tokens
    }

    pub fn distribute(env: Env) {
        // Iterate over the participants and distribute tokens
    }
}

mod test;
