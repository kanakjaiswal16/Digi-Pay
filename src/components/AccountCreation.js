import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CSS/AccountCreation.css";
console.log(process.env.REACT_APP_ETHERSCAN_API_KEY);
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
        "https://eth-sepolia.g.alchemy.com/v2/-4e5fsDjluNgzUNf9u0nNElwVvNV2QYq"
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
            `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=4I49XGQC3GP8AWXKZBJ8UEZRKXV4JW1ZK7`
          );
          const data = await response.json();
          console.log(data);
          if (data.status === "1") {
            setTransactions(data.result);
          } else {
            console.error("Error fetching transaction history:", data.message);
            toast.error(
              "Error fetching transaction history. Please try again.",
              {
                position: toast.POSITION.TOP_RIGHT,
              }
            );
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
          "https://eth-sepolia.g.alchemy.com/v2/-4e5fsDjluNgzUNf9u0nNElwVvNV2QYq"
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
    <div className="container">
      <h2 className="title">Digi Pay</h2>
      <p className="description">Welcome to Decentralized Crypto Wallet</p>
      {!isRecover && !isCreate && (
        <button className="primary-button" onClick={handleCreateAccount}>
          Create Account
        </button>
      )}
      {!isRecover && !isCreate && (
        <button className="secondary-button" onClick={handleRecoverAccount}>
          Recover
        </button>
      )}

      {isRecover && !isSeed && (
        <div className="input-container">
          <input
            className="input"
            type="text"
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter seed phrase"
          />
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}

      {wallet && !isSeed && (
        <>
          <p className="seed-phrase-text">
            Keep the seed phrase safe for recovery purposes:
          </p>
          <p className="seed-phrase">{seedPhrase}</p>
          <button className="next-button" onClick={handleNext}>
            Next
          </button>
        </>
      )}

      {wallet && isSeed && (
        <div className="account-details-container">
          <p className="address-text">Address: {wallet.address}</p>
          <p className="balance-text">Account Balance: {accountBalance} ETH</p>
          <div className="account-inputs">
            <input
              type="text"
              placeholder="Enter Address"
              onChange={handleReceiverChange}
            />
            <input
              type="number"
              placeholder="Enter amount"
              onChange={handleAmountChange}
            />
          </div>
          <button className="send-button" onClick={handleSend}>
            Send
          </button>

          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
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

                <p>From: {tx.from}</p>
                <p>To: {tx.to}</p>
                <p>Value: {ethers.utils.formatEther(tx.value)} ETH</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
