const { GENESIS_DATA, MINE_RATE } = require("../config");
const { cryptoHash } = require("../util");
const hexToBinary = require('hex-to-binary');

class Block {
    constructor({ timestamp, hash, data }) {
        this.timestamp = timestamp;
        this.hash = hash;
        this.data = data;
    }


    static genesis() {
        let genesisBlock = new this(GENESIS_DATA);
        genesisBlock.validatorsMap = {};
        return genesisBlock;
    }

    static createBlock({ transaction }) {
        let timestamp = Date.now();
        let hash = cryptoHash(timestamp, transaction);

        return new this({
            timestamp, hash, data: transaction
        });
    }

    /*static mineBlock({ lastBlock, data }) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let { difficulty } = lastBlock;
        let nonce = 0;

        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this({
            timestamp, lastHash, data, difficulty, nonce, hash
        });
    }

    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;
        if (difficulty < 1) return 1;
        if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1;
        return difficulty + 1;
    }*/

}

module.exports = Block;