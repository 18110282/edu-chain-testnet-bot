require("dotenv").config();
const fs = require("fs");
const Web3 = require("web3");
const readlineSync = require("readline-sync");
const colors = require("colors");
const axios = require("axios");
const readline = require("readline");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

const INFO_WALLETS_PATH = "./info-wallets.txt";
const WALLET_LIST = readWalletFile(INFO_WALLETS_PATH);


const RPC_URL = process.env.RPC_URL;
const ROUTER_GAINZSWAP_ADDRESS = process.env.ROUTER_GAINZSWAP_ADDRESS;

const USDT_ADDRESS = process.env.USDT_ADDRESS;
const GAINZ_ADDRESS = process.env.GAINZ_ADDRESS;
const GRASP_ADDRESS = process.env.GRASP_ADDRESS;
const EDU_ADDRESS = process.env.EDU_ADDRESS;
const TOKEN_PAIRS = [
  {
    name: "USDT -> EDU",
    path: [USDT_ADDRESS, GAINZ_ADDRESS, GRASP_ADDRESS, EDU_ADDRESS],
  },
  { name: "USDT -> GAINZ", path: [USDT_ADDRESS, GAINZ_ADDRESS] },
  { name: "GAINZ -> USDT", path: [GAINZ_ADDRESS, USDT_ADDRESS] },
];

const APPROVE_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [
      { internalType: "bool", name: "", type: "bool" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    // payable: false,
    stateMutability: "view",
    type: "function"
  },
];

const SWAP_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" }
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
];

const web3 = new Web3(RPC_URL);
const swapRouter = new web3.eth.Contract(SWAP_ABI, ROUTER_GAINZSWAP_ADDRESS);

let PRIVATE_KEY = "";
let MY_ADDRESS = "";


async function swapTokens(pairIndex, amountSwap, numTxns) {
  const selectedPair = TOKEN_PAIRS[pairIndex];
  const path = selectedPair.path;
  const address = MY_ADDRESS;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const amountIn = web3.utils.toWei(amountSwap.toString(), "ether");
  const amountOutMin = "0";
  
  for (let i = 0; i < path.length; i++) {
    if (i < path.length - 1) {
      const rs = await approveToken(USDT_ADDRESS);
      if (!rs) {
        return;
      }        
      console.log(colors.yellow(`Da check allowance cua ${path[i]}`));
    }
  }
  // Swap
  console.log(
    colors.yellow(`Dang thuc hien ${numTxns} giao dich swap tu ${selectedPair.name}...`)
  );

  for (let i = 1; i <= numTxns; i++) {
    try {
      console.log(`Giao dịch ${i}/${numTxns}:`);
      const tx = swapRouter.methods.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        address,
        deadline
      );
      const txData = {
        from: address,
        to: ROUTER_GAINZSWAP_ADDRESS,
        data: tx.encodeABI(),
      };
      const gasEstimate = await web3.eth.estimateGas(txData);

      txData.gas = gasEstimate;

      const signedTx = await web3.eth.accounts.signTransaction(
        txData,
        PRIVATE_KEY
      );
      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      console.log(
        colors.green(
          "Swap successful, transaction-hash is: ",
          receipt.transactionHash
        )
      );
    } catch (error) {
      console.log(
        colors.red(
          `Giao dich so ${numTxns} that bai...`
        )
      );
      console.error(colors.red("Swap fail, reason is: ", error.message));
    }
  }
}

async function approveToken(address) {
  try {
    const approveTokenContract = new web3.eth.Contract(
      APPROVE_TOKEN_ABI,
      address
    );
    const amount = web3.utils.toWei("100000000", "ether");
    const allowance = await approveTokenContract.methods
      .allowance(MY_ADDRESS, ROUTER_GAINZSWAP_ADDRESS)
      .call();
    console.log(allowance);
    if (web3.utils.toBN(allowance) < web3.utils.toBN(amount)) {
      console.log("Approve token...");

      const tx = approveTokenContract.methods.approve(
        ROUTER_GAINZSWAP_ADDRESS,
        amount
      );
      const txData = {
        from: MY_ADDRESS,
        to: address,
        data: tx.encodeABI(),
        nonce: await web3.eth.getTransactionCount(MY_ADDRESS, "pending"),
      };
      const gasEstimate = await web3.eth.estimateGas(txData);
      txData.gas = gasEstimate;

      const signedTx = await web3.eth.accounts.signTransaction(
        txData,
        PRIVATE_KEY
      );
      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      console.log(
        colors.green(
          "Approve successful, transaction-hash is: ",
          receipt.transactionHash
        )
      );
    }
    return true;
  } catch (error) {
    console.error(colors.red("Approve fail, reason is: ", error.message));
    return false;
  }
}

function displayHeader() {
  console.log("========================================".gray);
  console.log("=         EDU-CHAIN-TESTNET-BOT        =".magenta);
  console.log("========================================".gray);
  console.log("Danh sach chuc nang: ".green);
  console.log("1. Swap tai https://www.gainzswap.xyz/".cyan);
  console.log("2. Lend tai https://app.blend.fan/".cyan);
  console.log("3. Exit".red);
  console.log();
  let selectedFunction;
  while (true) {
    selectedFunction = readlineSync.questionInt(colors.yellow(
      "Chon chuc nang(Nhap STT): "
    ));
    if (selectedFunction < 1 || selectedFunction > 3) {
      console.log(colors.red("Lua chon khong hop le"));
    } else {
      break;
    }
  }
  return selectedFunction;
}

async function swapTokensMenu() {
  console.log("Danh sach cac cap co the swap: ");
  TOKEN_PAIRS.forEach((pair, index) => {
    console.log(`${index + 1}. ${pair.name}`);
  });

  let selectedPairIndex;
  while (true) {
    selectedPairIndex = readlineSync.questionInt(colors.blue(
      "Chon cap token (nhap STT): "
    )) - 1;
    if (selectedPairIndex < 0 || selectedPairIndex >= TOKEN_PAIRS.length) {
      console.log(colors.red("Lua chon khong hop le"));
    } else {
      break;
    }
  }


  const numTxns = readlineSync.questionInt(colors.blue(
    "Nhap so luong giao dich can thuc hien: "
  ));

  const amountSwap = readlineSync.questionFloat(colors.blue(
    `Nhap so luong ${TOKEN_PAIRS[selectedPairIndex].name.split(" -> ")[0]} muon swap: `
  ));

  for (let i = 0; i < WALLET_LIST.length; i++) {
    const wallet = WALLET_LIST[i];
    PRIVATE_KEY = wallet.privateKey;
    MY_ADDRESS = wallet.walletAddress;
    await swapTokens(selectedPairIndex, amountSwap, numTxns);
  }
}

// Main Display
async function main() { 
  while (true) {
    const functionNumber = displayHeader();
      switch (functionNumber) {
        case 1:
          await swapTokensMenu();
          console.log(colors.grey("________________________"));
          break;
        case 2:
          console.log(colors.grey("Chua phat trien"));
          console.log(colors.grey("________________________"));
          break;
        case 3:
          console.log(colors.grey("Exited!"));
          break;
      }
      if (functionNumber === 3) {
        break;
      }
    }
}

function readWalletFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const wallets = fileContent
    .replace(/\r/g, '') 
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [privateKey, walletAddress] = line.split('-').map(part => part.trim());
      return { privateKey, walletAddress };
    });

  return wallets;
}


main();