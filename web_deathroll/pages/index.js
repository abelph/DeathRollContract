import {useState, useEffect} from 'react'
import Head from 'next/head'
import Web3 from 'web3'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import deathrollContract from '../blockchain_folder/deathroll'

export default function Home() {
  const [web3, setWeb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState()
  const [lotteryPot, setLotteryPot] = useState(0)
  const [lotteryPlayers, setPlayers] = useState([])
  const [lotteryHistory, setLotteryHistory] = useState([])
  const [lotteryId, setLotteryId] = useState()
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [dicenum, setDicenum] = useState(10)
  const [randomNum, setRandomNum] = useState(0)

  useEffect(() => {
    updateState()
  }, [lcContract])

  const updateState = () => {
    if (lcContract) getPot()
    if (lcContract) getPlayers()
    if (lcContract) getLotteryId()
    if (lcContract) getrandomNum()
    if (lcContract) getdiceNum()
    console.log("update state button")
  }

  const getrandomNum = async () => {
    const randomnumber = await lcContract.methods.lookatRandom().call()
    setRandomNum(randomnumber)
  }

  const getdiceNum = async () => {
    const diceresult = await lcContract.methods.lookatDiceNum().call()
    setDicenum(diceresult)
  }
  
  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setLotteryPot(web3.utils.fromWei(pot, 'ether'))
  }

  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setPlayers(players)
  }

  const getHistory = async (id) => {
    setLotteryHistory([])
    for (let i = parseInt(id); i > 0; i--) {
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotteryId)
    await getHistory(lotteryId)
  }

  const enterLotteryHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.enter().send({
        from: address,
        value: '15000000000000000',
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const getrandomNumHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.startRandom().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const rollHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.roll().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const payWinnerHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.getWinnerByLottery(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const connectWalletHandler = async () => {
    console.log("got to wallet button lcicked")
    setError('')
    setSuccessMsg('')
    /* check if MetaMask is installed */
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        /* request wallet connection */
        await window.ethereum.request({ method: "eth_requestAccounts"})
        /* create web3 instance & set to state */
        const web3 = new Web3(window.ethereum)
        /* set web3 instance in React state */
        setWeb3(web3)
        /* get list of accounts */
        const accounts = await web3.eth.getAccounts()
        /* set account 1 to React state */
        setAddress(accounts[0])

        /* create local contract copy */
        const lc = deathrollContract(web3)
        setLcContract(lc)

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          console.log(accounts[0])
          /* set account 1 to React state */
          setAddress(accounts[0])
        })
      } catch(err) {
        setError(err.message)
      }
    } else {
      /* MetaMask is not installed */
      console.log("Please install MetaMask")
    }
  }


  return ( 

    <div>
      <Head>
        <title>DeathRoll</title>
        <meta name="description" content="Deathroll Game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className = "navbar mt-4 mb-4">
          <div className = "container">
            <div className = "navbar-brand">
              <h1> Death</h1>
              <h2> Roll</h2>
              </div>
              <div className = "navbar-end">
                <button onClick = {connectWalletHandler} className = "button is-link"> Connect Wallet</button>
              </div>
          </div>
        </nav>

        <div className = "container" >
          <section className = "mt-5">
            <div className = "columns">
                <div className = "column is-one-third is-bordered">
                  <section className = "mt-5">
                    <p><b>Any Player: </b>Enter the Pot by sending 0.015 ETH</p>
                    <button onClick={enterLotteryHandler} className = "button is-link is-large is-light mt-3"> Play now</button>
                    </section>
                    <section className = "wrapnum">
                      <p><b>Next Player only: </b>Get Random Number</p>
                      <button onClick={getrandomNumHandler} className = "button is-primary is-large is-light mt-3"> Get Random Number!</button>
                      <p>Your Random Number is: {randomNum}</p>
                    </section>
                    <section className = "mt-6">
                      <p><b>Next Player only: </b>Roll Dice (Need random number above 0)</p>
                      <button onClick={rollHandler} className = "button is-primary is-large is-light mt-3"> Roll!</button>
                    </section>
                    <section className = "mt-6">
                      <p><b>Owner only: </b>Pay Winner</p>
                      <button onClick={payWinnerHandler} className = "button is-primary is-large is-light mt-3"> Pay Out!</button>
                    </section>
                    
                    <section>
                      <div className="container has-text-danger mt-6">
                        <p>{error}</p>
                      </div>
                    </section>
                    <section>
                      <div className="container has-text-success mt-6">
                        <p>{successMsg}</p>
                      </div>
                    </section>
                </div>
                
                <div className = "column is-one-third has-centered pr-6">
                  <div className = "card">
                    <div className = "card-content has-text-centered">
                      <div className = "content is-centered">
                        <section className = "title is-2 pb-3">
                          <h3>Current dice number</h3>
                        </section>
                        <section className = "title is-1 is-centered">
                          <h3>{dicenum}</h3>
                        </section>
                        <section className = "mt-6">
                          <button onClick={updateState} className = "button is-primary is-large is-light mt-3"> Update!</button>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${styles.blackinfo} column is-one-third`}>
                <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> Winner History </h3>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className="history-entry mt-3" key={item.id}>
                                <div>Lottery #{item.id} winner:</div>
                                <div>
                                  <a href={`https://etherscan.io/address/${item.address}`} target="_blank">
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })
                        }
                      </div>
                    </div>
                  </div>
                </section>

                <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> Players ({lotteryPlayers.length})</h3>
                        <ul className="ml-0"> 
                        {
                            (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player, index) => {
                              return <li key={`${player}-${index}`}>
                                <a href={`https://etherscan.io/address/${player}`} target="_blank">
                                  {player}
                                </a>
                              </li>
                            })
                        }
                        </ul>
                      </div>
                    </div>
                  </div>
                  </section>

                  <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> Pot</h3>
                        <p>{lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>  
                  </section>
                </div>
              </div>
            </section>
          </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2022 Deathroll Team Argan</p>
      </footer>
    </div>
  )
}
