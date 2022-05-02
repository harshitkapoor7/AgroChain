const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const Blockchain = require('./blockchain/index');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const Validators = require('./validators');
const ValidatorsCCR = require('./validators/validatorsCCR');
const fs = require('fs');
const { deepParseJson } = require('deep-parse-json');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const validators = new Validators();
const validatorsCCR = new ValidatorsCCR();
const pubsub = new PubSub({ blockchain, transactionPool, wallet, validators, validatorsCCR });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
let userEmail = '';
let publicAddress = [];

app.use(bodyParser.json());
app.use(express.urlencoded());
app.use(cors());
app.use(express.static(path.join(__dirname, 'client/dist')));


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    wallet: { type: Object, required: true },
    publicAddresses: { type: Array }
});

const treeChainSchema = new mongoose.Schema({
    chain: { type: Object },
    validators: { type: Array },
    transactions: { type: Object },
    identifier: { type: String, required: true }
});

const User = new mongoose.model("user", userSchema);
const Chain = new mongoose.model("chain", treeChainSchema);



mongoose.connect('mongodb://localhost:27017/treechain', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, () => {
    console.log("DB connection established");
    try {
        Chain.findOne({ identifier: '20184161' }, (err, chain) => {
            if (chain) {
                updateFromDB();
            }
            else {
                flag = 1;
                const chain = new Chain({
                    chain: blockchain.chain[0], validators: validators.validators,
                    transactions: {}, identifier: '20184161'
                });
                chain.save(err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(chain, 'Saved treechain details in DB');
                    }
                })
            }
        })
    } catch (err) { }
})

app.post("/login", (req, res) => {
    const { email, password } = req.body
    User.findOne({ email: email }, (err, user) => {

        if (user) {
            if (password === user.password) {
                res.send({ message: "Login Successfull", user: user })
                userEmail = email;
                retrieveWalletDetails(email);
            } else {
                res.send({ message: "Password didn't match" })
            }
        } else {
            res.send({ message: "User not registered" })
        }
    })


})


app.post("/register", (req, res) => {
    const { name, email, password } = req.body
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            res.send({ message: "User already registerd" })
        } else {
            const userWallet = {
                balance: wallet.balance, validator: wallet.validator
            };
            publicAddress.push(wallet.publicKey);
            const user = new User({
                name,
                email,
                password,
                wallet: userWallet,
                publicAddresses: publicAddress
            })
            user.save(err => {
                if (err) {
                    res.send(err)
                    console.log(err);
                } else {
                    res.send({ message: "Successfully Registered, Please login now." })
                }
            })

        }
    })
})


app.get('/api/wallet', (req, res) => {
    res.send(wallet.keyPair);
})

app.get('/api/blocks', (req, res) => {
    let chain = [];
    let transactionsMap = blockchain.chain[0].validatorsMap;
    if (transactionsMap) {
        for (let key of Object.keys(transactionsMap)) {
            let value = transactionsMap[key];
            for (let i = 0; i < value.length; i++) {
                chain.push(value[i]);
            }
        }
    }
    res.json(chain);
});

app.post('/api/validators', (req, res) => {
    const { validatorId } = req.body;
    validators.addValidator(validatorId);
    blockchain.addValidator(validatorId);
    pubsub.broadcastValidators(validatorId);
    validatorsCCR.distributeCCR(validators.validators);
    updatetoDB();
});

const updatetoDB = () => {
    const databasename = "treechain";

    MongoClient.connect('mongodb://localhost:27017/').then((client) => {
        const connect = client.db(databasename);

        const collection = connect.collection("chains");

        collection.updateOne({ identifier: "20184161" },
            { $set: { validators: validators.validators, chain: blockchain.chain[0], transactions: transactionPool.transactionMap } }, function (err, res) {
                if (err) throw err;
                console.log("Validators updated in DB");
            });

        try {
            const collectionUsers = connect.collection("users");


            collectionUsers.updateOne({ email: userEmail },
                { $set: { wallet: { balance: wallet.balance, validator: wallet.validator } } }, function (err, res) {
                    if (err) throw err;
                    console.log("Validator interest updated");
                });
        } catch (err) { console.log(err) };

    }).catch((err) => {
        console.log(err.Message);
    })
}

const updateFromDB = () => {
    const databasename = "treechain";

    MongoClient.connect('mongodb://localhost:27017/').then((client) => {
        const connect = client.db(databasename);

        const collection = connect.collection("chains");

        collection.findOne({ identifier: "20184161" }, function (err, result) {
            if (err) throw err;
            blockchain.chain[0] = result.chain;
            validators.validators = result.validators;
            transactionPool.transactionMap = result.transactions;
            validatorsCCR.distributeCCR(validators.validators);
            if (validators.validators.indexOf(publicAddress[0]) != -1) {
                wallet.switchValidator(true);
            }
            else {
                wallet.switchValidator(false);
            }

        });

    }).catch((err) => {
        console.log(err.Message);
    })
}

const retrieveWalletDetails = (email) => {
    const databasename = "treechain";

    MongoClient.connect('mongodb://localhost:27017/').then((client) => {
        const connect = client.db(databasename);

        const collection = connect.collection("users");

        collection.findOne({ email: email }, function (err, result) {
            if (err) throw err;
            wallet.balance = result.wallet.balance;
            wallet.validator = result.wallet.validator;
            publicAddress = result.publicAddresses;

            if (publicAddress.indexOf(wallet.publicKey) === -1)
                publicAddress.push(wallet.publicKey);

            collection.updateOne({ email: email },
                { $set: { publicAddresses: publicAddress } }, function (err, res) {
                    if (err) throw err;
                });
        });


    }).catch((err) => {
        console.log(err.Message);
    })
}

app.post('/api/wallet-info', (req, res) => {
    const { validatorInterest } = req.body;
    wallet.switchValidator(validatorInterest);
    updatetoDB();
});

app.get('/api/chain', (req, res) => {
    res.json(blockchain.chain[0]);
});



app.post('/api/test', (req, res) => {
    let previousTime = Date.now();
    let data = '';
    let validatorId = 'a';
    for (let j = 1; j <= 60; j++) {
        let time = 0;
        validatorId += 'b';
        validators.addValidator(validatorId);
        blockchain.addValidator(validatorId);
        pubsub.broadcastValidators(validatorId);

        for (let i = 1; i <= 10; i++) {
            const amount = 1;
            const recipient = 'test';
            let chain = [];
            let transactionsMap = blockchain.chain[0].validatorsMap;
            for (let key of Object.keys(transactionsMap)) {
                let value = transactionsMap[key];
                for (let i = 0; i < value.length; i++) {
                    chain.push(value[i]);
                }
            }
            let transaction = transactionPool
                .existingTransaction({ inputAddress: wallet.publicKey });

            try {
                if (transaction) {
                    transaction.update({ senderWallet: wallet, recipient, amount });
                }
                else {
                    transaction = wallet.createTransaction({ recipient, amount, chain });
                }
            } catch (error) {
                return res.status(400).json({ type: 'error', message: error.message });
            };

            transactionPool.setTransaction(transaction);

            pubsub.broadcastTransaction(transaction);

            blockchain.addValidatedBlock({ transaction, validatorId: wallet.publicKey });
            transactionPool.deleteTransaction(transaction.id);
            pubsub.broadcastChain(blockchain.chain[0].validatorsMap);
            // console.log(i,'Block added. Time taken: ',Date.now()-previousTime,' ms');
            time += Date.now() - previousTime;
            previousTime = Date.now();
        }
        data += j;
        data += ' : ';
        data += time;
        data += '\n';
    }
    // console.log('Average time taken: ', time/25, ' ms');

    fs.writeFile('Output.txt', data, (err) => {

        // In case of a error throw err.
        if (err) throw err;
    })
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    let chain = [];
    let transactionsMap = blockchain.chain[0].validatorsMap;
    for (let key of Object.keys(transactionsMap)) {
        let value = transactionsMap[key];
        for (let i = 0; i < value.length; i++) {
            chain.push(value[i]);
        }
    }
    let transaction = transactionPool
        .existingTransaction({ inputAddress: wallet.publicKey });

    try {
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        }
        else {
            transaction = wallet.createTransaction({ recipient, amount, chain });
        }
    } catch (error) {
        return res.status(400).json({ type: 'error', message: error.message });
    };

    transactionPool.setTransaction(transaction);
    updatetoDB();
    try {
        pubsub.broadcastTransaction(transaction);
    } catch (error) { }

    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();

    res.redirect('/api/blocks');
});

app.get('/api/mine-validator-transactions', (req, res) => {
    let allTransactions = transactionPool.validTransactions();
    let transactionsToBeMined = [];
    let flag = 0;
    for (let i = 0; i < allTransactions.length; i++) {
        let transactionId = allTransactions[i].id;
        let hash = transactionIdHash(transactionId);
        console.log(publicAddress[0],'range', validatorsCCR.validatorMap);
        if (validatorsCCR.validatorMap.has(publicAddress[0])) {
            let range = validatorsCCR.validatorMap.get(publicAddress[0]);
            console.log(range,'range');
            if (range[0] <= hash && range[1] >= hash) {
                flag = 1;
                blockchain.addValidatedBlock({ transaction: allTransactions[i], validatorId: publicAddress[0] });
                transactionPool.deleteTransaction(transactionId);
            }
        }
    }
    pubsub.broadcastChain(blockchain.chain[0].validatorsMap);
    updatetoDB();
    if (flag === 0) {
        res.json('No transactions to be mined');
    }
    else {
        res.json('');
    }

});

app.get('/api/wallet-info', (req, res) => {
    // const address = wallet.publicKey;
    const address = publicAddress[0];
    let chain = [];
    let transactionsMap = blockchain.chain[0].validatorsMap;
    for (let key of Object.keys(transactionsMap)) {
        let value = transactionsMap[key];
        for (let i = 0; i < value.length; i++) {
            chain.push(value[i]);
        }
    }
    res.json({
        walletInfo: {
            address,
            balance: Wallet.calculateBalance({ chain, address })
        },
        validatorInterest: wallet.validator
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/chain` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

const transactionIdHash = (transactionId) => {
    let num = 0;
    for (let i = 0; i < transactionId.length; i++) {
        num += transactionId.charCodeAt(i);
    }
    return num % 62;
}

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);
    // updateFromDB();
    if (PORT !== DEFAULT_PORT) {
        let time = Date.now();
        syncWithRootState();
        console.log(Date.now() - time, ' ms');
    }
});

module.exports.obj = pubsub;