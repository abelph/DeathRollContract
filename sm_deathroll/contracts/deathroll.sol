// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract deathroll is VRFConsumerBase {
    address public owner;
    address payable[] public players;
    uint public lotteryId;
    mapping (uint => address payable) public lotteryHistory;

    bytes32 internal keyHash; // identifies which Chainlink oracle to use
    uint internal fee;        // fee to get random number
    uint public randomResult;
    bool gamestarted;
    uint public dicenum;
    uint public playerindex;

    constructor()
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF coordinator
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709  // LINK token address
        ) {
            keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
            fee = 0.1 * 10 ** 18;    // 0.1 LINK
            //initialize variables for the contract
            owner = msg.sender;
            playerindex = 0;
            dicenum = 10;
            gamestarted = false;
            lotteryId = 1;
            randomResult = 0;
        }

    function getRandomNumber() public returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK in contract"); 
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint randomness) internal override {
        randomResult = randomness; //overrides internal function to get random number from chainlink
    }

    function getWinnerByLottery(uint lottery) public view returns (address payable) {
        return lotteryHistory[lottery]; //gets the individual winner with index
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function lookatRandom() public view returns (uint) {
        return randomResult;
    }

    function lookatDiceNum() public view returns (uint) {
        return dicenum;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function enter() public payable {
        require(msg.value > .01 ether);
        require(gamestarted == false);
        players.push(payable(msg.sender));
    }

    function startRandom() public currentplayer {
        if(dicenum == 10) {
            gamestarted = true; //only does 1 time
        }
        require(randomResult == 0); //prevents getting another random number for same turn
        require(players.length > 1);
        require(gamestarted = true);
        getRandomNumber();
    }

    function roll() public currentplayer{
        require(randomResult > 0, "Must have a source of randomness when rolling");
        dicenum = randomResult % dicenum; //returns a range between 0 to dicenum-1
        if(dicenum == 0){
            gamestarted = false; //end the game and get winning player's index
            playerindex = winnerindex();
        } 
        else{
            playerindex = nextturn();          
        }
        randomResult = 0;
    }

    function payWinner() public onlyowner {   
        require(gamestarted == false);
        require(dicenum == 0); //game has to be done      
        players[playerindex].transfer(address(this).balance);
        lotteryHistory[lotteryId] = players[playerindex];
        lotteryId++;
        // reset the state of the contract
        players = new address payable[](0);
        dicenum = 10;
        gamestarted = false;
        playerindex = 0;
    }

    function winnerindex() private returns(uint){ //private to avoid index manipulation
        if (playerindex == 0){
            playerindex = players.length-1;
        } else{
            playerindex=playerindex-1;
        }
        return playerindex;
    }

    function nextturn() private returns(uint) {
        if (playerindex == players.length-1){
            playerindex = 0;
        } else{
            playerindex=playerindex+1;
        }
        return playerindex;
    }

    modifier onlyowner() {
      require(msg.sender == owner);
      _;
    }

    modifier currentplayer() { //so only the next player can roll
      require(msg.sender == players[playerindex]);
      _;
    }
}

