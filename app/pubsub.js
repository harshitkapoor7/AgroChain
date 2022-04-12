const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-edd29309-3bb0-452d-83e0-41e0b30ec5af',
    subscribeKey: 'sub-c-6140050c-874c-11eb-a540-2a2aff149455',
    secretKey: 'sec-c-ZWUxNTQ2ODItNjY4Mi00ZWU1LWFlYWMtOTRhMmUyYWFiZjBi'
};


const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION',
    VALIDATORS: 'VALIDATORS',
    VALIDATORSCCR: 'VALIDATORSCCR'
};

class PubSub {
    constructor({ blockchain, transactionPool, wallet, validators, validatorsCCR }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.validators = validators;
        this.validatorsCCR = validatorsCCR;

        this.pubnub = new PubNub(credentials);

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

        this.pubnub.addListener(this.listener());
    }

    broadcastChain(validator) {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(validator)
        });
    }

    broadcastTransaction(transaction){
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
          });
    }

    broadcastValidators(chain){
        this.publish({
            channel: CHANNELS.VALIDATORS,
            message: JSON.stringify(chain)
          });
    }

    broadcastValidatorsCCR(map){
        this.publish({
            channel: CHANNELS.VALIDATORSCCR,
            message: JSON.stringify(map)
          });
    }

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;
                
                   // console.log(`Message received. Channel: ${channel}. Message: ${message}.`);
                
                const parsedMessage = JSON.parse(message);
                switch(channel){
                    case CHANNELS.VALIDATORSCCR:
                        this.blockchain.replaceChain(parsedMessage, this.validatorsCCR, true);
                    case CHANNELS.VALIDATORS:
                        // console.log('Validators',this.blockchain.chain[0]);

                        if(parsedMessage != this.wallet.publicKey) {
                            this.validators.addValidator(parsedMessage);
                            this.validatorsCCR.distributeCCR(this.validators.validators);
                            this.blockchain.addValidator(parsedMessage);
                        }
                        break;
                    case CHANNELS.BLOCKCHAIN:
                        // this.blockchain.replaceChain(parsedMessage, this.validatorsCCR, true);
                        this.blockchain.replaceChain(parsedMessage, this.validatorsCCR, () => {
                            this.transactionPool.clearBlockchainTransactions({ validatorTransactionMap: parsedMessage });
                        });
                        break;
                    case CHANNELS.TRANSACTION:
                        this.transactionPool.setTransaction(parsedMessage);
                        /*if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                          })) {
                            this.transactionPool.setTransaction(parsedMessage);
                          }*/
              
                        break;
                    
                    default:
                        return;
                }
            }
        };
    }

    publish({ channel, message }) {
        this.pubnub.publish({ message, channel });
    }
}

module.exports = PubSub;
