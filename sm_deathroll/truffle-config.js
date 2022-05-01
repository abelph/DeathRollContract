require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const private_keys = [
  process.env.PRIVATE_KEY_1
]; 
console.log(`https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`)
console.log(private_keys)
console.log("anything there?")

module.exports = {

  networks: {

    rinkeby: {
      provider: () => new HDWalletProvider({
        privateKeys: private_keys,
        providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
        numberOfAddresses: 1  
      }),
      network_id: 4,
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },

  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.12",    // Fetch exact version from solc-bin (default: truffle's version)

    }
  },
};
