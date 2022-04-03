// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract deathrollGame is VRFConsumerBaseV2 {

    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;



  // Your subscription ID.
  uint64 s_subscriptionId;

  // Rinkeby coordinator. For other networks,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;

  // Rinkeby LINK token contract. For other networks,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

  // The gas lane to use, which specifies the maximum gas price to bump to.
  // For a list of available gas lanes on each network,
  // see https://docs.chain.link/docs/vrf-contracts/#configurations
  bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

  // Depends on the number of requested values that you want sent to the
  // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
  // so 100,000 is a safe default for this example contract. Test and adjust
  // this limit based on the network that you select, the size of the request,
  // and the processing of the callback request in the fulfillRandomWords()
  // function.
  uint32 callbackGasLimit = 100000;

  // The default is 3, but you can set this higher.
  uint16 requestConfirmations = 3;

  // For this example, retrieve 2 random values in one request.
  // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
  uint32 numWords =  2;

//   uint256[] public s_randomWords;
    uint256[] public s_randomWords = [1000, 500, 200, 10, 2, 1];
  uint256 public s_requestId;
  address s_owner;

//   constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {

//   }

  // Assumes the subscription is funded sufficiently.
  function requestRandomWords() public
//   external onlyOwner {
    {
    // Will revert if subscription is not set and funded.
    s_requestId = COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }
  
  function fulfillRandomWords(
    uint256, /* requestId */
    uint256[] memory randomWords
  ) internal override {
    s_randomWords = randomWords;
  }

  modifier onlyOwner() {
    require(msg.sender == s_owner);
    _;
  }




    address public player1;
    address public player2;
    uint256 public betAmount;
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


    // Setup methods

    constructor(uint256 _timeoutInterval, uint256 _diceSize, uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) public payable {
        player1 = msg.sender;
        betAmount = msg.value;
        state.diceSize = _diceSize;
        timeoutInterval = _timeoutInterval;



        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        LINKTOKEN = LinkTokenInterface(link);
        s_owner = msg.sender;
        s_subscriptionId = subscriptionId;
    }

    function join() public payable {
        //require(player2 == 0, "Game has already started.");
        require(!gameOver, "Game was canceled.");
        require(msg.value == betAmount, "Wrong bet amount.");

        player2 = msg.sender;
        state.whoseTurn = player1;

        emit GameStarted();
    }

    function cancel() public {
        //require(msg.sender == player1, "Only first player may cancel.");
        //require(player2 == 0, "Game has already started.");

        gameOver = true;
        payable(msg.sender).transfer(address(this).balance);
    }


    // Play methods

    function move() public {
        require(!gameOver, "Game has ended.");
        require(msg.sender == state.whoseTurn, "Not your turn.");
        //assume random number is generated for now
        // requestRandomWords();
        
        // state.diceSize = s_randomWords[0] % state.diceSize;
        state.diceSize = s_randomWords[count];
        count += 1;
        state.whoseTurn = opponentOf(msg.sender);
        
        // Clear timeout
        timeout = 2**256 - 1;

        if (state.diceSize == 1) {
            gameOver = true;
            payable(msg.sender).transfer(address(this).balance); //change to make address payable
        }

        emit RollMade(msg.sender, randomExample);
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
