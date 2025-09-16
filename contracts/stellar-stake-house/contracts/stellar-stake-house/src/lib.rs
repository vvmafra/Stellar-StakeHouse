#![no_std]
use soroban_sdk::{contract, contractimpl, vec, Address, Env, String, Symbol, Vec, Map, symbol_short, Val, IntoVal, TryIntoVal};

// Contract storage keys for allowance system
const ALLOWANCES: Symbol = symbol_short!("ALLOW");
const XLM_SAC_CONTRACT: Symbol = symbol_short!("XLM_SAC");

// XLM SAC Contract ID (testnet)
// Para mainnet, use: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
const XLM_SAC_CONTRACT_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

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
    /// 2. XLM SAC token authorization
    /// @param spender - The address authorized to spend your XLM
    /// @param amount - Maximum amount in stroops (1 XLM = 10,000,000 stroops)
    /// @param expiration_ledger - Ledger sequence when allowance expires
    pub fn approve(env: Env, owner: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        owner.require_auth();
        
        // Set internal allowance
        let mut allowances: Map<(Address, Address), i128> = env
            .storage()
            .persistent()
            .get(&ALLOWANCES)
            .unwrap_or(Map::new(&env));
        
        allowances.set((owner.clone(), spender.clone()), amount);
        env.storage().persistent().set(&ALLOWANCES, &allowances);
        
        // Also approve on XLM SAC
        Self::approve_xlm(env.clone(), owner.clone(), spender.clone(), amount, expiration_ledger);
        
        env.events().publish((symbol_short!("approve"), owner, spender), amount);
    }

    /// Transfer XLM from one account to another using the allowance
    /// @param from - The account to transfer from
    /// @param to - The account to transfer to  
    /// @param amount - Amount to transfer in stroops
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        // Require authorization from the spender
        spender.require_auth();
        
        // Check both internal allowance and XLM SAC allowance
        let allowances: Map<(Address, Address), i128> = env
            .storage()
            .persistent()
            .get(&ALLOWANCES)
            .unwrap_or(Map::new(&env));
            
        let current_allowance = allowances
            .get((from.clone(), spender.clone()))
            .unwrap_or(0);
            
        if current_allowance < amount {
            panic!("Insufficient internal allowance");
        }
        
        // Also check XLM SAC allowance
        let xlm_allowance = Self::get_xlm_allowance(env.clone(), from.clone(), spender.clone());
        if xlm_allowance < amount {
            panic!("Insufficient XLM SAC allowance");
        }
        
        // Perform the actual XLM transfer using XLM SAC
        Self::transfer_xlm(env.clone(), from.clone(), to.clone(), amount);
        
        // Update internal allowance
        let new_allowance = current_allowance - amount;
        let mut updated_allowances = allowances;
        
        if new_allowance > 0 {
            updated_allowances.set((from.clone(), spender.clone()), new_allowance);
        } else {
            updated_allowances.remove((from.clone(), spender.clone()));
        }
        
        env.storage().persistent().set(&ALLOWANCES, &updated_allowances);
        
        // Emit transfer event
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

    /// Get XLM balance for an address
    /// @param address - The address to check balance for
    /// @return The XLM balance in stroops
    pub fn balance_of(env: Env, address: Address) -> i128 {
        Self::get_xlm_balance(env, address)
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&Symbol::new(&env, "owner")).unwrap_or(Address::from_string(&String::from_str(&env, "")))
    }

    /// Initialize XLM SAC contract address
    pub fn initialize_xlm_sac(env: Env, xlm_sac_address: Address) {
        // Only allow initialization once
        if env.storage().instance().has(&XLM_SAC_CONTRACT) {
            panic!("XLM SAC contract already initialized");
        }
        env.storage().instance().set(&XLM_SAC_CONTRACT, &xlm_sac_address);
    }

    /// Get XLM SAC contract address
    pub fn get_xlm_sac_address(env: Env) -> Address {
        env.storage().instance().get(&XLM_SAC_CONTRACT)
            .unwrap_or_else(|| Address::from_string(&String::from_str(&env, XLM_SAC_CONTRACT_ID)))
    }

    /// Get XLM balance for an address using XLM SAC
    pub fn get_xlm_balance(env: Env, address: Address) -> i128 {
        let xlm_sac = Self::get_xlm_sac_address(env.clone());
        
        // Call balance function on XLM SAC
        let result: Val = env.invoke_contract(
            &xlm_sac,
            &Symbol::new(&env, "balance"),
            vec![&env, address.into_val(&env)]
        );
        
        // Convert result to i128
        result.try_into_val(&env).unwrap_or(0)
    }

    /// Transfer XLM using XLM SAC
    pub fn transfer_xlm(env: Env, from: Address, to: Address, amount: i128) {
        let xlm_sac = Self::get_xlm_sac_address(env.clone());
        
        // Call transfer function on XLM SAC
        env.invoke_contract::<()>(
            &xlm_sac,
            &Symbol::new(&env, "transfer"),
            vec![
                &env,
                from.into_val(&env),
                to.into_val(&env),
                amount.into_val(&env)
            ]
        );
    }

    /// Approve XLM spending using XLM SAC
    pub fn approve_xlm(env: Env, from: Address, spender: Address, amount: i128, expiration_ledger: u32) {
        let xlm_sac = Self::get_xlm_sac_address(env.clone());
        
        // Call approve function on XLM SAC
        env.invoke_contract::<()>(
            &xlm_sac,
            &Symbol::new(&env, "approve"),
            vec![
                &env,
                from.into_val(&env),
                spender.into_val(&env),
                amount.into_val(&env),
                expiration_ledger.into_val(&env)
            ]
        );
    }

    /// Get XLM allowance using XLM SAC
    pub fn get_xlm_allowance(env: Env, from: Address, spender: Address) -> i128 {
        let xlm_sac = Self::get_xlm_sac_address(env.clone());
        
        // Call allowance function on XLM SAC
        let result: Val = env.invoke_contract(
            &xlm_sac,
            &Symbol::new(&env, "allowance"),
            vec![
                &env,
                from.into_val(&env),
                spender.into_val(&env)
            ]
        );
        
        // Convert result to i128
        result.try_into_val(&env).unwrap_or(0)
    }

    pub fn transfer_from_xlm_sac(env: Env, from: Address, to: Address, amount: i128) {
        let xlm_sac = Self::get_xlm_sac_address(env.clone());
        
        // Check if the from address has enough XLM balance
        let balance = Self::get_xlm_balance(env.clone(), from.clone());
        if balance < amount {
            panic!("Insufficient XLM balance");
        }
        
        // Get all participants
        let users = Self::get_participants(env.clone());
        let mut total_holders_balance: i128 = 0;
        let mut valid_users: Vec<Address> = Vec::new(&env);
        
        for user in users.iter() {
            let user_balance = Self::get_xlm_balance(env.clone(), user.clone());
            if user_balance > 0 {
                total_holders_balance += user_balance;
                valid_users.push_back(user.clone());
            }
        }

        if total_holders_balance <= 0 {
            panic!("No valid users to transfer XLM");
        }
        
        let APR = amount * (365/30) / total_holders_balance;
        for user in valid_users.iter() {
            let user_balance = Self::get_xlm_balance(env.clone(), user.clone());
            let user_apr = (user_balance * APR) / 365;
            Self::transfer_xlm(env.clone(), from.clone(), user.clone(), user_apr);
        }
    }
    
}

mod test;
