#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, String, Address, Symbol, Vec as SorobanVec};
use soroban_sdk::testutils::Address as TestAddress;

#[test]
fn test_hello() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let words = client.hello(&String::from_str(&env, "Dev"));
    assert_eq!(
        words,
        vec![
            &env,
            String::from_str(&env, "Hello"),
            String::from_str(&env, "Dev"),
        ]
    );
}

#[test]
fn test_join_adds_user_to_participants() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Create a dummy address for the user
    let user = <soroban_sdk::Address as TestAddress>::generate(&env);

    // Call join(user)
    client.join(&user);

    // Read back participants from storage within the contract context
    let participants: SorobanVec<Address> = env.as_contract(&contract_id, || {
        let key = Symbol::new(&env, "participants");
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| SorobanVec::new(&env))
    });

    assert_eq!(participants.len(), 1);
    assert_eq!(participants.get_unchecked(0), user);
}

#[test]
fn test_authorize_owner_storage() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());

    // Test that we can set and retrieve the owner_authorized flag
    env.as_contract(&contract_id, || {
        env.storage().instance().set(&Symbol::new(&env, "owner_authorized"), &true);
    });

    let owner_authorized: bool = env.as_contract(&contract_id, || {
        env.storage()
            .instance()
            .get(&Symbol::new(&env, "owner_authorized"))
            .unwrap_or(false)
    });

    assert_eq!(owner_authorized, true);
}