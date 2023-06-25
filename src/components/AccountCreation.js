import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CSS/AccountCreation.css";
import blockchain from "./CSS/Blockchain.json";
import logo from "./CSS/Logo.json";
import Lottie from "lottie-react";


export default function AccountCreation() {
  const [isRecover, setRecover] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [wallet, setWallet] = useState(null);
  const [isCreate, setCreate] = useState(false);
  const [isSeed, setSeed] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (wallet) {
      const provider = new ethers.providers.JsonRpcProvider(
        "Your RPC URL"
      );

      // Function to fetch the updated balance
      const fetchBalance = async () => {
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance);
        setAccountBalance(formattedBalance);
      };

      const fetchTransactionHistory = async () => {
        try {
          const response = await fetch(
            `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=Your_API`
          );
          const data = await response.json();
          console.log(data);
          if (data.status === "1") {
            setTransactions(data.result);
          }
        } catch (error) {
          console.error("Error fetching transaction history:", error);
          toast.error("Error fetching transaction history. Please try again.", {
            position: toast.POSITION.TOP_RIGHT,
          });
        }
      };

      // Fetch the initial balance
      fetchBalance();
      fetchTransactionHistory();

      // Fetch the updated balance every 10 seconds
      const interval = setInterval(() => {
        fetchBalance();
        fetchTransactionHistory();
      }, 10000);

      // Clean up the interval on component unmount
      return () => clearInterval(interval);
    }
  }, [wallet]);

  const handleCreateAccount = () => {
    setCreate(true);
    const wallet = ethers.Wallet.createRandom();
    const generatedSeedPhrase = wallet.mnemonic.phrase;

    setWallet(wallet);
    setSeedPhrase(generatedSeedPhrase);
  };

  const handleRecoverAccount = () => {
    setRecover(true);
  };

  const handleSubmit = () => {
    setSeed(true);
    const wallet = ethers.Wallet.fromMnemonic(seedPhrase);

    setWallet(wallet);
  };

  function handleNext() {
    setSeed(true);
  }

  function onLogout() {
    setRecover(false);
    setCreate(false);
    setSeed(false);
    setWallet(null);
  }

  function handleReceiverChange(e) {
    setReceiver(e.target.value);
  }

  function handleAmountChange(e) {
    setAmount(e.target.value);
  }

  async function handleSend() {
    if (receiver !== "" && amount > 0 && amount < accountBalance) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          "Your RPC URL"
        );
        const walletWithProvider = wallet.connect(provider);
        const transaction = await walletWithProvider.sendTransaction({
          to: receiver,
          value: ethers.utils.parseEther(amount),
        });

        await transaction.wait(); // Wait for the transaction to be mined

        toast.success("Transaction Successful", {
          position: toast.POSITION.TOP_RIGHT,
        });

        const updatedBalance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(updatedBalance);

        setAccountBalance(formattedBalance);
      } catch (error) {
        console.error("Error sending transaction:", error);
        toast.error("Error sending transaction. Please try again.", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } else {
      toast.warn("Please enter recipient address and valid amount.", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  }

  return (
    <div className="application">
      <div className="container">
        <div className="col-1-of-2 animation">
          <div style={{ width: "80%", height: "80%" }}>
            <Lottie animationData={blockchain} />
          </div>
        </div>
        <div className="col-1-of-2 content">
          <div className="titleBar">
            <Lottie animationData={logo} className="anime" />
            <h2 className="title">Digi Pay</h2>
          </div>
          <p className="description">A Decentralized Crypto Wallet</p>
          <div className="buttons">
            {!isRecover && !isCreate && (
              <button
                className="btn btn--white btn--animated"
                onClick={handleCreateAccount}
              >
                Create Account
              </button>
            )}
            {!isRecover && !isCreate && (
              <button
                className="btn btn--white btn--animated"
                onClick={handleRecoverAccount}
              >
                Recover
              </button>
            )}
          </div>

          {isRecover && !isSeed && (
            <div className="input-container">
              <input
                className="enter_address_field"
                type="text"
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="Enter seed phrase"
              />
              <button className="btn-text subBtn" onClick={handleSubmit}>
                Submit &rarr;
              </button>
            </div>
          )}

          {wallet && !isSeed && (
            <div className="secondFrame">
              <p className="seed-phrase-text">
                Keep the seed phrase safe for recovery purposes:
              </p>
              <div className="seedcopy">
                <span type="text" className="seed_phrase_input">
                  {seedPhrase}
                </span>
                <abbr title="Copy to clipboard">
                  <button className="copyBtn">&#128203;</button>
                </abbr>
              </div>
              <button className="btn-text nextButton" onClick={handleNext}>
                Next &rarr;
              </button>
            </div>
          )}

          {wallet && isSeed && (
            <div className="account-details-container">
              <div className="account__details">
                <label>Address</label>
                <p className="address-text">{wallet.address}</p>
                <label>Account Balance</label>
                <p className="balance-text">{accountBalance} ETH</p>
              </div>
              <div className="account-inputs">
                <input
                  type="text"
                  placeholder="Enter Address"
                  className="enter_address_field"
                  onChange={handleReceiverChange}
                />
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="enter_amount_field"
                  onChange={handleAmountChange}
                />
              </div>
              <div className="form_btns">
                <button
                  className="btn btn--blue send-button"
                  onClick={handleSend}
                >
                  Send
                </button>
                <button
                  className="btn btn--blue logout-button"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
              {/* </div> */}
              <div className="transaction-history">
                <h3>Transaction History</h3>
                {transactions.map((tx, index) => (
                  <div key={index} className="transaction">
                    <p className="hash">
                      Hash:{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tx.hash}
                      </a>
                    </p>
                    <div className="transacDets">
                      <div>
                        <label>From</label>
                        <p>{tx.from}</p>
                      </div>
                      <div>
                        <label>To</label>
                        <p>{tx.to}</p>
                      </div>
                      <div className="ethereumVal">
                        <p>Value: {ethers.utils.formatEther(tx.value)} ETH</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ToastContainer />
        </div>
      </div>
    </div>
  );
}
