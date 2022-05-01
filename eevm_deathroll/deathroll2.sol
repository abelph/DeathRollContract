// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract deathrollGame{

  uint256[] public s_randomWords = [1000, 500, 200, 10, 2, 1];
  uint256 public s_requestId;
  address s_owner;

  modifier onlyOwner() {
    require(msg.sender == s_owner);
    _;
  }

    address public player1;
    address public player2;
    // uint256 public betAmount;
    uint8 public randomExample;
     //starting dice side and bet amount - 1 player proposes, the second player agrees
    //start with starting amount ($) 
    //50 sided dice - d50
    bool public gameOver;
    struct GameState {
        uint256 diceSize;
        address whoseTurn;
    }
    GameState public state;

    uint256 public timeoutInterval;
    uint256 public timeout = 2**256 - 1;
    uint256 count = 0;

    event GameStarted();
    event TimeoutStarted();
    event RollMade(address player, uint8 value);
    event GameWinner(address player);

    // Setup methods

    constructor(uint256 _timeoutInterval, uint256 _diceSize) payable {
        player1 = msg.sender;
        // betAmount = msg.value;
        state.diceSize = _diceSize;
        timeoutInterval = _timeoutInterval;

        s_owner = msg.sender;

    }
    function getDiceSize() public view returns (uint256) {
        return state.diceSize;
    }

    function join() public payable returns (uint256) {
        //require(player2 == 0, "Game has already started.");
        require(!gameOver, "Game was canceled.");
        // require(msg.value == betAmount, "Wrong bet amount.");

        player2 = msg.sender;
        state.whoseTurn = player1;

        emit GameStarted();
        return 0;
    }

    function cancel() public {
        //require(msg.sender == player1, "Only first player may cancel.");
        //require(player2 == 0, "Game has already started.");

        gameOver = true;
        emit GameWinner(player1);
        payable(msg.sender).transfer(address(this).balance);
    }


    // Play methods

    function move(uint256 randomval) public returns (uint256) {
        require(!gameOver, "Game has ended.");
        require(msg.sender == state.whoseTurn, "Not your turn.");
        //assume random number is generated for now
        // requestRandomWords();
        
        // state.diceSize = s_randomWords[0] % state.diceSize;
        state.diceSize = randomval % state.diceSize;
        count += 1;
        state.whoseTurn = opponentOf(msg.sender);
        
        // Clear timeout
        timeout = 2**256 - 1;

        if (state.diceSize == 0) {
            gameOver = true;
            GameWinner(state.whoseTurn);
            // payable(msg.sender).transfer(address(this).balance); //change to make address payable
        }

        emit RollMade(msg.sender, randomExample);
        return 0;
    }

    function opponentOf(address player) internal view returns (address) {
        //require(player2 != 0, "Game has not started.");

        if (player == player1) {
            return player2;
        } else if (player == player2) {
            return player1;
        } else {
            revert("Invalid player.");
        }
    }


    // Timeout methods

    function startTimeout() public {
        require(!gameOver, "Game has ended.");
        require(state.whoseTurn == opponentOf(msg.sender),
            "Cannot start a timeout on yourself.");

        timeout = block.timestamp + timeoutInterval;
        emit TimeoutStarted();
    }

    function claimTimeout() public {
        require(!gameOver, "Game has ended.");
        require(block.timestamp >= timeout);

        gameOver = true;
        payable(opponentOf(state.whoseTurn)).transfer(address(this).balance);
    }


}
