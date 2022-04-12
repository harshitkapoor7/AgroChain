const Transaction = require("./transaction");

class TransactionPool{
    constructor(){
        this.transactionMap = {};
    }

    clear(){
        this.transactionMap = {};
    }

    setTransaction(transaction){
        this.transactionMap[transaction.id] = transaction;
    }

    setMap(transactionMap){
        this.transactionMap = transactionMap;
    }

    existingTransaction({ inputAddress }){
        const transactions = Object.values(this.transactionMap);

        return transactions.find(transaction => transaction.input.address === inputAddress);
    }

    validTransactions(){
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)
        );
    }

    deleteTransaction(transactionId) {
        if(this.transactionMap[transactionId]){
            delete this.transactionMap[transactionId];
        }
    }

    clearBlockchainTransactions({ validatorTransactionMap }) {
        let chain = [];
        if(validatorTransactionMap) {
            for(let key of Object.keys(validatorTransactionMap)) {
                let value =  validatorTransactionMap[key];
                for(let i=0;i<value.length;i++) {
                    chain.push(value[i]);
                }
            }
        }

        for(let i=chain.length-1;i>=0;i--) {
            const block = chain[i];
            if(Array.isArray(block.data)) {
                for(let transaction of block.data) {
                    let id = transaction.id;
                    if(this.transactionMap[id])
                        delete this.transactionMap[id];
                }
            }
            else {
                let transaction = block.data;
                let id = transaction.id;
                if(this.transactionMap[id])
                    delete this.transactionMap[id];
            }
        }
    }
}

module.exports = TransactionPool;