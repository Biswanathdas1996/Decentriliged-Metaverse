require("dotenv").config();

const express = require("express");
const serverless = require("serverless-http");

const app = require("express")();
const router = express.Router();
const cors = require("cors");
const shortid = require("shortid");
var Web3 = require("web3");
var { encode, decode } = require("js-base64");
var ABI = require("../ABI.json");
var ADDRESS = require("../Address.json");

const getConfig = () => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://goerli.infura.io/v3/24022fda545f41beb59334bdbaf3ef32`
    )
  );
  const signer = web3.eth.accounts.privateKeyToAccount(
    `cf89a65abbe4cd80548d019aecb2927dacb52c04988905fd8e75dc8f982b391c`
  );
  web3.eth.accounts.wallet.add(signer);
  const contract = new web3.eth.Contract(ABI, ADDRESS);
  return { contract, signer };
};

app.use(cors());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

router.get("/", async (req, res) => {
  // const amount = req?.query?.price;
  try {
    res.json({
      id: 1,
      currency: "INR",
      amount: "123",
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/get-all-token", async (req, res) => {
  //   if (!req.headers["app-config-token"]) {
  //     return res.status(401).json({ message: "Missing Authorization Header" });
  //   }
  const { contract, signer } = getConfig();
  try {
    const response = await contract.methods
      .getToken()
      .call({ from: signer.address });
    console.log(response);
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

router.post("/create", async (req, res) => {
  const { contract, signer } = getConfig();
  try {
    const response = await contract.methods
      .create()
      .send({
        from: signer.address,
        // gas: await tx.estimateGas(),
        gas: "4700000",
        value: 0,
      })
      .once("transactionHash", (txhash) => {
        console.log(`Mining transaction ...`);
        console.log(txhash);
        return txhash;
      })
      .catch((error) => {
        const errorData = { error };
        return { error: errorData.error };
      });
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

router.post("/initiate-token-info", async (req, res) => {
  const { contract, signer } = getConfig();
  if (!req.body) res.json("Please add body");
  const tokenUID = req?.query?.token;
  if (!tokenUID) res.json("Token id missing");
  const tokenURI = JSON.stringify(req.body);
  try {
    const response = await contract.methods
      .addData(tokenUID, tokenURI)
      .send({
        from: signer.address,
        // gas: await tx.estimateGas(),
        gas: "4700000",
        value: 0,
      })
      .once("transactionHash", (txhash) => {
        console.log(`Mining transaction ...`);
        console.log(txhash);
        return txhash;
      })
      .catch((error) => {
        const errorData = { error };
        return { error: errorData.error };
      });
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

router.post("/add-transaction", async (req, res) => {
  //   if (!req.headers["app-config-token"]) {
  //     return res.status(401).json({ message: "Missing Authorization Header" });
  //   }
  // req.headers["app-config-token"]
  const { contract, signer } = getConfig();
  if (!req.body) res.json("Please add body");

  const tokenUID = req?.query?.token;
  if (!tokenUID) res.json("Token id missing");

  const response = await contract.methods
    .tokenURI(tokenUID)
    .call({ from: signer.address });
  const tokenData = response && JSON.parse(response);
  if (tokenData?.transction) {
    tokenData.transction.push(req.body);
  } else {
    const transaction = [req.body];
    tokenData.transction = transaction;
  }

  const tokenURI = JSON.stringify(tokenData);
  try {
    const response = await contract.methods
      .addData(tokenUID, tokenURI)
      .send({
        from: signer.address,
        // gas: await tx.estimateGas(),
        gas: "4700000",
        value: 0,
      })
      .once("transactionHash", (txhash) => {
        console.log(`Mining transaction ...`);
        console.log(txhash);
        return txhash;
      })
      .catch((error) => {
        const errorData = { error };
        return { error: errorData.error };
      });
    res.json(response);
  } catch (error) {
    console.log(error);
  }
});

router.get("/get-token-data", async (req, res) => {
  // check for basic auth header

  const { contract, signer } = getConfig();

  const tokenId = req?.query?.token;
  try {
    const response = await contract.methods
      .tokenURI(tokenId)
      .call({ from: signer.address });
    const outputData = response && JSON.parse(response);
    res.json(outputData);
  } catch (error) {
    console.log(error);
  }
});

// app.use()

// const PORT = process.env.PORT || 1337;

// app.listen(PORT, () => {
//   console.log("Backend running at localhost:1337");
// });

app.use(`/.netlify/functions/api`, router);
module.exports = app;
module.exports.handler = serverless(app);
