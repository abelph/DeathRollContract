import {useState, useEffect} from 'react'
import Head from 'next/head'
import Web3 from 'web3'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import deathrollContract from '../blockchain_folder/deathroll'

export default function Home() {
  const[web3, setWeb3] = useState()
  const[address, setAddress] = useState()
  const [dcContract, setdcContract] = useState()
  const [currentPot, setPot] = useState()
  const [players, setPlayers] = useState()
  const [lotteryhistory, Setlotteryhistory] = useState()
  const [lotteryid, Setlotteryid] = useState()
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")


  useEffect(() => {
    if(dcContract) getPot()
    if(dcContract) getPlayers()
    if(dcContract) getHistory()
    if(dcContract) getLotteryId()
  }, [dcContract, currentPot, players])
 
  const getPot = async () => {
    const pot = await dcContract.methods.getBalance().call()
    setPot(web3.utils.fromWei(pot, 'ether'))
  }

  const getPlayers = async () => {
    const fromplayers = await dcContract.methods.getPlayers().call()
    setPlayers(fromplayers)
  }
  
  const getHistory = async () => {
    const history = await dcContract.methods.lotteryHistory().call()
    Setlotteryhistory(history)
  }

  const getLotteryId = async () => {
    const lotteryID = await dcContract.methods.lotteryId().call()
    Setlotteryhistory(lotteryID)
  }
  const playNow = async () => {
    try{
        await dcContract.methods.enter().send({
          from: address,
          value: '15000000000000000',
          gas: 300000,
          gasPrice: null
        })
    }
    catch(err){
      setError(err.message)
    }
  }

  const pickWinnerHandler = async () => {
    try{
        await dcContract.methods.payWinner().send({
          from: address,
          gas: 300000,
          gasPrice: null
        })
    }
    catch(err){
      setError(err.message)
    }
  }
  const connectWallet = async () => {
    if(typeof window !== "undefined" && typeof window.ethereum!== "undefined"){
      try{
        await window.ethereum.request({method: "eth_requestAccounts"})
        const web3 = new Web3(window.ethereum)
        setWeb3(web3)

        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0])
        //create local contract copy
        const dc = deathrollContract(web3)
        setdcContract(dc)

      }catch(err){
        setError(err.message)
      }
    }
    else{
      setError("Please install MetaMask")
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
                <button onClick = {connectWallet} className = "button is-link"> Connect Wallet</button>
              </div>
          </div>
        </nav>

        <div className = "container" >
          <section className = "mt-5">
            <div className = "columns">
                <div className = "column is-two-thirds">
                  <section className = "mt-5">
                    <p>Enter the Casino by sending 0.015 ETH</p>
                    <button onClick={playNow} className = "button is-link is-large is-light mt-3"> Play now</button>
                    </section>
                    <section className = "mt-6">
                    <p><b>Admin only: </b>Pick winner</p>
                    <button onClick={pickWinnerHandler} className = "button is-primary is-large is-light mt-3"> Pick Winner</button>
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
                <div className = {`${styles.blackinfo} column is-one-third`}>
                  <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> History</h3>
                        <div className = "History-entry">
                          <div> DeathRoll #1 Winner </div>
                          <div> 
                            <a href = "https://etherscan.io/address/0x73797adf2f48901c1aBd3a983dd5f264D961A1D6" target = "_blank"> 
                            0x73797adf2f48901c1aBd3a983dd5f264D961A1D6</a>
                          </div>
                          </div>
                      </div>
                    </div>
                  </div>
                  </section>

                  <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> Players ({players?.length})</h3>
                        <ul> 
                          {
                            (players && players.length > 0) && players.map((player, index) =>  {
                              return <li key={`${player}-${index}`}>
                                <a href = {`https://etherscan.io/address/${player}`} target = "_blank"> 
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
                        <p>{currentPot} Ether</p>
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
        <p>&copy; 2022 Block Explorer</p>
      </footer>
    </div>
  )
}
