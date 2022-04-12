const Block = require("./block");
const { cryptoHash } = require("../util");
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addValidator(validatorId){
        if(!this.chain[0].validatorsMap.hasOwnProperty(validatorId)) {
            this.chain[0].validatorsMap[validatorId] = [];
        }
    }

    addValidatedBlock({ transaction, validatorId}) {
        let existingValidatorTransactions = this.chain[0].validatorsMap[validatorId];
        let newBlock = Block.createBlock({ transaction });
        existingValidatorTransactions.push(newBlock);
        this.chain[0].validatorsMap[validatorId] = existingValidatorTransactions;
    }

    /*addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });

        this.chain.push(newBlock);
    }*/

    replaceChain(validatorsTransactionMap, validatorsCCR, onSuccess) {
        if(validatorsTransactionMap && validatorsTransactionMap.size) {
            for(let key of Object.keys(validatorsTransactionMap)) {
                let validator = key;
                if(validatorsCCR.validatorMap.has(validator)) {
                    let range = validatorsCCR.validatorMap.get(validator);
                    for(let i=0;i<value.length;i++) {
                        let currentTransactionId = value[i].id;
                        let hash = this.transactionIdHash(currentTransactionId);
                        if(range[0]<=hash && range[1]>=hash) {
                            
                        }
                        else {
                            return;
                        }
                    }
                }
                else {
                    return;
                }
            }
        }

        if (onSuccess)
            onSuccess();
        if(validatorsTransactionMap)
            this.chain[0].validatorsMap = validatorsTransactionMap;

        /*if (chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        }
        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }

        if(validateTransactions && !this.validTransactionData({ chain })){
            console.error('The incoming chain has invalid data');
            return;
        }

        if (onSuccess)
            onSuccess();
        // console.log('replacing chain with', chain);
        this.chain = chain;*/
    }

    transactionIdHash(transactionId){
        let num = 0;
        for(let i=0;i<transactionId.length;i++) {
            num+=transactionId.charCodeAt(i);
        }
        return num%62;
    }

    validTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;

                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }

                }
                else{
                    if(!Transaction.validTransaction(transaction)){
                        console.error('Invalid transaction');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if(transaction.input.amount !== trueBalance){
                        console.error('Invalid input amount');
                        return false;
                    }

                    if(transactionSet.has(transaction)){
                        console.error('Duplicate transactions appear');
                        return false;
                    }
                    else{
                        transactionSet.add(transaction);
                    }
                }

            }
        }
        return true;
    }

    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))
            return false;

        for (let i = 1; i < chain.length; i++) {
            const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
            const lastHashValue = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;

            if (lastHash !== lastHashValue) return false;

            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
            if (hash !== validatedHash) return false;
            if (Math.abs(lastDifficulty - difficulty) > 1) return false;
        }
        return true;
    }
}

module.exports = Blockchain;