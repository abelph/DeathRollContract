import {useState} from 'react'
import Head from 'next/head'
import Web3 from 'web3'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'

export default function Home() {
  const[web3, setWeb3] = useState()
  const[address, setAddress] = useState()

  const connectWallet = async () => {
    if(typeof window !== "undefined" && typeof window.ethereum!== "undefined"){
      try{
        await window.ethereum.request({method: "eth_requestAccounts"})
        const web3 = new Web3(window.ethereum)
        setWeb3(web3)

        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0])
      }catch(err){
        console.log(err.message)
      }
    }
    else{
      console.log("Please install MetaMask")
    }
  }



  return ( 

    <div>
      <Head>
        <title>BlackJack</title>
        <meta name="description" content="BlackJack Game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className = "navbar mt-4 mb-4">
          <div className = "container">
            <div className = "navbar-brand">
              <h1> Black</h1>
              <h2> Jack</h2>
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
                    <p>Enter the Casino by sending 0.01 ETH</p>
                    <button className = "button is-link is-large is-light mt-3"> Play now</button>
                    </section>
                    <section className = "mt-6">
                    <p><b>Admin only: </b>Pick winner</p>
                    <button className = "button is-primary is-large is-light mt-3"> Play now</button>
                    </section>

                </div>
                <div className = {`${styles.blackinfo} column is-one-third`}>
                  <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> History</h3>
                        <div className = "History-entry">
                          <div> BlackJack #1 Winner </div>
                          <div> 
                            <a href = "0x1413fF4234502A2ac11904025EdCA4626EB27F6A" target = "_blank"> 
                            0x1413fF4234502A2ac11904025EdCA4626EB27F6A</a>
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
                        <h3> Players (1)</h3>
                        <div> 
                            <a href = "0x1413fF4234502A2ac11904025EdCA4626EB27F6A" target = "_blank"> 
                            0x1413fF4234502A2ac11904025EdCA4626EB27F6A</a>
                          </div>
                      </div>
                    </div>
                  </div>
                  </section>

                  <section className = "mt-5"> 
                  <div className = "card">
                    <div className = "card-content">
                      <div className = "content">
                        <h3> Pot</h3>
                        <p>10 ETH</p>
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
