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

uint256_t player1 = get_random_address();
uint256_t player2 = get_random_address();



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

std::vector<uint8_t> join(Environment& env, const eevm::Address& contract_address, eevm::Address& player2){
  auto function_call = eevm::to_bytes(
    env.contract_definition["hashes"]["join()"]);
  auto caller = player2;
  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);
  return output;
}

std::vector<uint8_t> move(Environment& env, const eevm::Address& contract_address, eevm::Address& player, const uint256_t randomval){
  auto function_call = eevm::to_bytes(
    env.contract_definition["hashes"]["move(uint256)"]);
  auto caller = player;
  auto hw_randomval = randomval^get_random_uint256();

  append_argument(function_call, hw_randomval);

  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);

  return output;
}


uint256_t get_diceSize(Environment& env, const eevm::Address& contract_address){
  const auto caller = get_random_address();

  auto function_call =
    eevm::to_bytes(env.contract_definition["hashes"]["getDiceSize()"]);

  const auto output =
    run_and_check_result(env, caller, contract_address, function_call);

  return eevm::from_big_endian(output.data(), output.size());
}

uint256_t opponentOf(uint256_t current_player){
  if(current_player == player1) return player2;
  if(current_player == player2) return player1;

  return -1;

}

int main(int argc, char** argv)
{
  srand(time(nullptr));

  if (argc < 2)
  {
    std::cout << fmt::format("Usage: {} path/to/hello_combined.json", argv[0])
              << std::endl;
    return 1;
  }

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

  const auto owner_address = player1;
  // Create environment
  eevm::SimpleGlobalState gs;
  Environment env{gs, owner_address, deathroll_definition};


  uint256_t timeoutInterval = 888;
  uint256_t diceSize = 1234;

  // Deploy the contract
  const auto contract_address = deploy_contract(env, timeoutInterval, diceSize);
  auto result_join = join(env, contract_address, player2);
  auto current_player = player1;
  while(diceSize > 0){
    move(env, contract_address, current_player, get_random_uint256());
    diceSize = get_diceSize(env, contract_address);
    std::cout << "after " << current_player <<"'s move, diceSice = " << diceSize << std::endl;
    current_player = opponentOf(current_player);
  }
  std::cout << diceSize << std::endl;
  if(diceSize == 0){
    std::cout << "Winner : " << current_player << std::endl;
  }

  return 0;
}

