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

    constructor()
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF coordinator
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709  // LINK token address
        ) {
            keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
            fee = 0.1 * 10 ** 18;    // 0.1 LINK

            owner = msg.sender;
            lotteryId = 1;
        }

    function getRandomNumber() public returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK in contract");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint randomness) internal override {
        randomResult = randomness;
    }

    function getWinnerByLottery(uint lottery) public view returns (address payable) {
        return lotteryHistory[lottery];
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        // address of player entering lottery
        players.push(payable(msg.sender));
    }

    function pickWinner() public onlyowner {
        getRandomNumber();
    }

    function payWinner() public onlyowner {
        require(randomResult > 0, "Must have a source of randomness before choosing winner");
        uint index = randomResult % players.length;
        players[index].transfer(address(this).balance);

        lotteryHistory[lotteryId] = players[index];
        lotteryId++;
        
        // reset the state of the contract
        players = new address payable[](0);
    }

    modifier onlyowner() {
      require(msg.sender == owner);
      _;
    }
}

    // uint256 public betAmount;
    // uint8 public randomExample;
    //  //starting dice side and bet amount - 1 player proposes, the second player agrees
    // //start with starting amount ($) 
    // //50 sided dice - d50
    // bool public gameOver;
    // struct GameState {
    //     uint8 diceSize;
    //     address whoseTurn;
    // }
    // GameState public state;

    // uint256 public timeoutInterval;
    // uint256 public timeout = 2**256 - 1;

    // event GameStarted();
    // event TimeoutStarted();
    // event RollMade(address player, uint8 value);


    // // Setup methods

    // constructor(uint256 _timeoutInterval, uint8 _diceSize) public payable {
    //     player1 = msg.sender;
    //     betAmount = msg.value;
    //     state.diceSize = _diceSize;
    //     timeoutInterval = _timeoutInterval;
    // }

    // function join() public payable {
    //     //require(player2 == 0, "Game has already started.");
    //     require(!gameOver, "Game was canceled.");
    //     require(msg.value == betAmount, "Wrong bet amount.");

    //     player2 = msg.sender;
    //     state.whoseTurn = player1;

    //     emit GameStarted();
    // }

    // function cancel() public {
    //     //require(msg.sender == player1, "Only first player may cancel.");
    //     //require(player2 == 0, "Game has already started.");

    //     gameOver = true;
    //     payable(msg.sender).transfer(address(this).balance);
    // }


    // // Play methods

    // function move() public {
    //     require(!gameOver, "Game has ended.");
    //     require(msg.sender == state.whoseTurn, "Not your turn.");
    //     //assume random number is generated for now

    //     state.diceSize = randomExample;
    //     state.whoseTurn = opponentOf(msg.sender);

    //     // Clear timeout
    //     timeout = 2**256 - 1;

    //     if (state.diceSize == 1) {
    //         gameOver = true;
    //         payable(msg.sender).transfer(address(this).balance); //change to make address payable
    //     }

    //     emit RollMade(msg.sender, randomExample);
    // }

    // function opponentOf(address player) internal view returns (address) {
    //     //require(player2 != 0, "Game has not started.");

    //     if (player == player1) {
    //         return player2;
    //     } else if (player == player2) {
    //         return player1;
    //     } else {
    //         revert("Invalid player.");
    //     }
    // }


    // // Timeout methods

    // function startTimeout() public {
    //     require(!gameOver, "Game has ended.");
    //     require(state.whoseTurn == opponentOf(msg.sender),
    //         "Cannot start a timeout on yourself.");

    //     timeout = block.timestamp + timeoutInterval;
    //     emit TimeoutStarted();
    // }

    // function claimTimeout() public {
    //     require(!gameOver, "Game has ended.");
    //     require(block.timestamp >= timeout);

    //     gameOver = true;
    //     payable(opponentOf(state.whoseTurn)).transfer(address(this).balance);
    // }