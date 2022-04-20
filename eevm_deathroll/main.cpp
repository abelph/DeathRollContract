// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "eEVM/opcode.h"
#include "eEVM/processor.h"
#include "eEVM/simple/simpleglobalstate.h"

#include <cassert>
#include <fmt/format_header_only.h>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <random>
#include <sstream>
#include <vector>

///////////////////////////////////////////////////////////////////////////////
//
// Util typedefs and functions
//
using Addresses = std::vector<eevm::Address>;

struct Environment
{
  eevm::GlobalState& gs;
  const eevm::Address& owner_address;
  const nlohmann::json& contract_definition;
};
void print_here(size_t n){
  std::cout << "here : " << n << std::endl;
}

size_t rand_range(size_t exclusive_upper_bound)
{
  std::random_device rand_device;
  std::mt19937 generator(rand_device());
  std::uniform_int_distribution<size_t> dist(0, exclusive_upper_bound - 1);

  return dist(generator);
}

uint256_t get_random_uint256(size_t bytes = 32)
{
  std::vector<uint8_t> raw(bytes);
  std::generate(raw.begin(), raw.end(), []() { return rand(); });
  return eevm::from_big_endian(raw.data(), raw.size());
}

eevm::Address get_random_address()
{
  return get_random_uint256(20);
}
///////////////////////////////////////////////////////////////////////////////

// Run input as an EVM transaction, check the result and return the output
std::vector<uint8_t> run_and_check_result(
  Environment& env,
  const eevm::Address& from,
  const eevm::Address& to,
  const eevm::Code& input)
{
  // Ignore any logs produced by this transaction
  eevm::NullLogHandler ignore;
  eevm::Transaction tx(from, ignore);

  // Record a trace to aid debugging
  eevm::Trace tr;
  eevm::Processor p(env.gs);

  // Run the transaction
  const auto exec_result = p.run(tx, from, env.gs.get(to), input, 0u, &tr);

  if (exec_result.er != eevm::ExitReason::returned)
  {
    // Print the trace if nothing was returned
    std::cerr << fmt::format("Trace:\n{}", tr) << std::endl;
    if (exec_result.er == eevm::ExitReason::threw)
    {
      // Rethrow to highlight any exceptions raised in execution
      throw std::runtime_error(
        fmt::format("Execution threw an error: {}", exec_result.exmsg));
    }

    throw std::runtime_error("Deployment did not return");
  }

  return exec_result.output;
}

// Modify code to append ABI-encoding of arg, suitable for passing to contract
// execution
void append_argument(std::vector<uint8_t>& code, const uint256_t& arg)
{
  // To ABI encode a function call with a uint256_t (or Address) argument,
  // simply append the big-endian byte representation to the code (function
  // selector, or bin). ABI-encoding for more complicated types is more
  // complicated, so not shown in this sample.
  const auto pre_size = code.size();
  code.resize(pre_size + 32u);
  eevm::to_big_endian(arg, code.data() + pre_size);
}

eevm::Address deploy_contract(
  Environment& env, const uint256_t _timeoutInterval, const uint256_t _diceSize)
{
  // Generate the contract address
  const auto contract_address = eevm::generate_address(env.owner_address, 0u);

  // Get the binary constructor of the contract
  auto contract_constructor = eevm::to_bytes(env.contract_definition["bin"]);
  // The constructor argument
  append_argument(contract_constructor, _timeoutInterval);
  append_argument(contract_constructor, _diceSize);

  // Set this constructor as the contract's code body
  auto contract = env.gs.create(contract_address, 0u, contract_constructor);

  // Run a transaction to initialise this account
  auto result =
    run_and_check_result(env, env.owner_address, contract_address, {});

  // Result of running the compiled constructor is the code that should be the
  // contract's body (constructor will also have setup contract's Storage)
  contract.acc.set_code(std::move(result));

  return contract.acc.get_address();
}

std::vector<uint8_t> join(Environment& env, const eevm::Address& contract_address){
  auto function_call = eevm::to_bytes(
    env.contract_definition["hashes"]["join()"]);
  const auto caller = get_random_address();
  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);
  return output;
}

std::vector<uint8_t> move(Environment& env, const eevm::Address& contract_address){
  auto function_call = eevm::to_bytes(
    env.contract_definition["hashes"]["move()"]);
  const auto caller = get_random_address();
  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);

  return output;
}

// Get the total token supply by calling totalSupply on the contract_address
// uint256_t get_total_supply(
//   Environment& env, const eevm::Address& contract_address)
// {
//   // Anyone can call totalSupply - prove this by asking from a randomly
//   // generated address
//   const auto caller = get_random_address();

//   const auto function_call =
//     eevm::to_bytes(env.contract_definition["hashes"]["totalSupply()"]);

//   const auto output =
//     run_and_check_result(env, caller, contract_address, function_call);

//   return eevm::from_big_endian(output.data(), output.size());
// }

// Get the current token balance of target_address by calling balanceOf on
// contract_address
uint256_t get_diceSize(Environment& env, const eevm::Address& contract_address){
  const auto caller = get_random_address();

  auto function_call =
    eevm::to_bytes(env.contract_definition["hashes"]["getDiceSize()"]);

  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);

  return eevm::from_big_endian(output.data(), output.size());
}
// Transfer tokens from source_address to target_address by calling transfer on
// contract_address
// std::vector<uint8_t> justHelloWorld(
//   Environment& env,
//   const eevm::Address& contract_address
//   /*const eevm::String& target_string*/)
// {
//   // To transfer tokens, the caller must be the intended source address
//   auto function_call = eevm::to_bytes(
//     env.contract_definition["hashes"]["justHelloWorld()"]);

//   const auto caller = get_random_address();

//   const auto output =
//     run_and_check_result(env, caller, contract_address, function_call);

//   return output;
// }

// std::vector<uint8_t> showHelloWorld(
//   Environment& env,
//   const eevm::Address& contract_address,
//   const std::string target_string)
// {
//   auto function_call = eevm::to_bytes(
//     env.contract_definition["hashes"]["showHelloWorld(string)"]);

//   const auto caller = get_random_address();
//   append_argument(function_call, target_string);

//   const auto output =
//     run_and_check_result(env, caller, contract_address, function_call);

//   return output;
// }
// Send N randomly generated token transfers. Some will be to new user addresses
// template <size_t N>
// void run_random_transactions(
//   Environment& env, const eevm::Address& contract_address, Addresses& users)
// {
//   const auto total_supply = get_total_supply(env, contract_address);
//   const auto transfer_max = (2 * total_supply) / N;

//   for (size_t i = 0; i < N; ++i)
//   {
//     const auto from_index = rand_range(users.size());
//     auto to_index = rand_range(users.size());

//     // Occasionally create new users and transfer to them. Also avoids
//     // self-transfer
//     if (from_index == to_index)
//     {
//       to_index = users.size();
//       users.push_back(get_random_address());
//     }

//     const auto amount = get_random_uint256() % transfer_max;

//     // transfer(env, contract_address, users[from_index], users[to_index], amount);
//   }
// }

// Print the total token supply and current token balance of each user, by
// sending transactions to the given contract_address
// void print_erc20_state(
//   const std::string& heading,
//   Environment& env,
//   const eevm::Address& contract_address,
//   const Addresses& users)
// {
//   const auto total_supply = get_total_supply(env, contract_address);

//   using Balances = std::vector<std::pair<eevm::Address, uint256_t>>;
//   Balances balances;

//   for (const auto& user : users)
//   {
//     balances.emplace_back(
//       std::make_pair(user, get_balance(env, contract_address, user)));
//   }

//   std::cout << heading << std::endl;
//   std::cout << fmt::format(
//                  "Total supply of tokens is: {}",
//                  eevm::to_lower_hex_string(total_supply))
//             << std::endl;
//   std::cout << "User balances: " << std::endl;
//   for (const auto& pair : balances)
//   {
//     std::cout << fmt::format(
//       " {} owned by {}",
//       eevm::to_lower_hex_string(pair.second),
//       eevm::to_checksum_address(pair.first));
//     if (pair.first == env.owner_address)
//     {
//       std::cout << " (original contract creator)";
//     }
//     std::cout << std::endl;
//   }
//   std::cout << std::string(heading.size(), '-') << std::endl;
// }

// erc20/main
// - Parse args
// - Parse ERC20 contract definition
// - Deploy ERC20 contract
// - Transfer ERC20 tokens
// - Print summary of state
int main(int argc, char** argv)
{
  srand(time(nullptr));

  if (argc < 2)
  {
    std::cout << fmt::format("Usage: {} path/to/hello_combined.json", argv[0])
              << std::endl;
    return 1;
  }

  // const uint256_t total_supply = 1000;
  Addresses users;

  // Create an account at a random address, representing the 'owner' who created
  // the ERC20 contract (gets entire token supply initially)
  const auto owner_address = get_random_address();
  users.push_back(owner_address);

  // Create one other initial user
  const auto alice = get_random_address();
  users.push_back(alice);

  // Open the contract definition file
  const auto contract_path = argv[1];
  std::ifstream contract_fstream(contract_path);
  if (!contract_fstream)
  {
    throw std::runtime_error(
      fmt::format("Unable to open contract definition file {}", contract_path));
  }

  // Parse the contract definition from file
  const auto contracts_definition = nlohmann::json::parse(contract_fstream);
  const auto all_contracts = contracts_definition["contracts"];
  const auto deathroll_definition = all_contracts["deathroll2.sol:deathrollGame"];

  // Create environment
  eevm::SimpleGlobalState gs;
  Environment env{gs, owner_address, deathroll_definition};


  uint256_t timeoutInterval = 888;
  uint256_t diceSize = 1234;
  print_here(0);

  // Deploy the contract
  const auto contract_address = deploy_contract(env, timeoutInterval, diceSize);
  print_here(1);
  auto result_join = join(env, contract_address);
  print_here(2);
  move(env, contract_address);
  print_here(3);

  diceSize = get_diceSize(env, contract_address);

  // const auto result = justHelloWorld(env, contract_address);

  // for(auto e: result_join){
  //   std::cout << e;
  // }
  // std::cout << std::endl;
  std::cout << diceSize << std::endl;

  return 0;
}
