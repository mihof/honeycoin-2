const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

require('dotenv').config();
require('./config/database');
require('./config/auth');

function checkAuth(req, res, next) {
  if (req.user) return next();
  return res.status(401).json({msg: 'Not Authorized'});
}

const isDevelopment = process.env.ENV === 'development';

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
const REDIS_URL = isDevelopment ?
  'redis://127.0.0.1:6379' :
  'redis://h:p713b6fc4a74c08cb024b3cde89287665817a84280729e284d5ea2a3d0c0f3025@ec2-34-206-60-49.compute-1.amazonaws.com:17639'

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

app.use(logger('dev'));
app.use(express.json());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,  'build')));

app.use('/api/users', require('./routes/api/users'));

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.post('/api/transact', checkAuth, (req, res) => {
  const { amount, recipient } = req.body;
  let transaction = transactionPool
    .existingTransaction({ inputAddress: wallet.publicKey });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount })
    } else {
      transaction = wallet.createTransaction({ 
        recipient, 
        amount, 
        chain: blockchain.chain 
      });
    }
  } catch(error) {
    return res.status(400).json({ type: 'error', message: error.message });
  }

  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);
  res.json({ type: 'success', transaction });
});

app.post('/api/mine', checkAuth, (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect('/api/blocks');
});

app.get('/api/transaction-pool-map', checkAuth, (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', checkAuth, (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey

  res.json({ 
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
  });
});

app.get('/api/known-addresses', (req, res) => {
  const addressMap = {};

  for (let block of blockchain.chain) {
    for (let transaction of block.data) {
      const recipient = Object.keys(transaction.outputMap);

      recipient.forEach(recipient => addressMap[recipient] = recipient);
    }
  }

  res.json(Object.keys(addressMap));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);
      
      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
    if(!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  })
};

if (isDevelopment) {
  const walletFoo = new Wallet();
  const walletBar = new Wallet();

  const generateWalletTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
      recipient, amount, chain: blockchain.chain
    });

    transactionPool.setTransaction(transaction);
  };

  const walletAction = () => generateWalletTransaction({
    wallet, recipient: walletFoo.publicKey, amount: 5
  });

  const walletFooAction = () => generateWalletTransaction({
    wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
  });

  const walletBarAction = () => generateWalletTransaction({
    wallet: walletBar, recipient: wallet.publicKey, amount: 15
  });

  for (let i=0; i<20; i++) {
  if (i%3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i%3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransactions();
  }
}

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`)

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});