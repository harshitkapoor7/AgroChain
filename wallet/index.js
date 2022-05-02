const { STARTING_BALANCE } = require("../config");
const { ec,cryptoHash } = require("../util");
const Transaction = require("./transaction");

class Wallet{
    constructor(){
        this.balance = STARTING_BALANCE;
        this.validator = false;
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }    

    sign(data){
        return this.keyPair.sign(cryptoHash(data));
    }

    switchValidator( validatorInterest ) {
        this.validator = validatorInterest;
    }

    createTransaction({ recipient, amount, chain}){

        if(chain){
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }

        if(amount > this.balance){
            throw new Error('Amount exceeds balance');
        }
        return new Transaction({ senderWallet: this, recipient, amount});
    }

    static calculateBalance({ chain, address }){
        let hasConductedTransaction = false;
        let totalOutput = 0;
        for(let i=chain.length-1;i>0;i--){
            const block = chain[i];
            if(Array.isArray(block.data)) {
                for(let transaction of block.data) {
                    if(transaction.input.address === address){
                        hasConductedTransaction = true;
                    }
                    const currOutput = transaction.outputMap[address];

                    if(currOutput){
                        totalOutput += currOutput;
                    }
                }
            }
            else {
                let transaction = block.data;
                if(!transaction)
                    break;
                if(transaction.input.address === address){
                    hasConductedTransaction = true;
                }
                const currOutput = transaction.outputMap[address];

                if(currOutput){
                    totalOutput += currOutput;
                }
            }
            if(hasConductedTransaction){
                break;
            }
        }

        return hasConductedTransaction ? totalOutput : STARTING_BALANCE + totalOutput;
    }
}


module.exports = Wallet;