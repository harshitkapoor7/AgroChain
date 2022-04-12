class ValidatorsCCR {

    constructor() {
        this.sortedValidators = [];
        this.validatorMap = new Map();
        this.custom_ascii = new Map();
    }

    setAscii() {
        let num=0;
        for(let i=48;i<=57;i++){
            this.custom_ascii.set(String.fromCharCode(i),num);
            num++;
        }
        for(let i=97;i<=122;i++){
            this.custom_ascii.set(String.fromCharCode(i),num);
            num++;
        }
        for(let i=65;i<=90;i++){
            this.custom_ascii.set(String.fromCharCode(i),num);
            num++;
        }
    }

    distributeCCR(allValidators) {
        this.sortedValidators = [];
        this.validatorMap.clear();
        this.setAscii();
        this.sortedValidators = this.sortValidators(allValidators);
        let range_size = Math.floor(62 / this.sortedValidators.length);
        let current = 0;
        let ccrs = [];
        for(let i = 0; i < this.sortedValidators.length; i++) {
            if(i === this.sortedValidators.length - 1)
                this.validatorMap.set(this.sortedValidators[i],[current, 61]);
            else
                this.validatorMap.set(this.sortedValidators[i],[current, current + range_size]);
            current += (range_size + 1);
        }
    }

    sortValidators(allValidators) {
        const mp = new Map();
        for(let i=0; i<allValidators.length; i++) {
            let kwm = this.findKWM(allValidators[i]);
            mp.set(allValidators[i],kwm);
        }
        const descMp = new Map([...mp.entries()].sort((a, b) => b[1] - a[1]));
        let sortedList = Array.from(descMp.keys());
        return sortedList;
    }

    findKWM(validator) {
        let kwm = 0;
        for(let i = 0; i < validator.length; i++) {
            kwm += this.custom_ascii.get(validator[i]);
        }
        return kwm;
    }
    

    findValidCCR(transaction_id, consensus_code_range) {
        for(let i = 0; i < consensus_code_range.length; i++) {
            if(custom_ascii[transaction_id[0]] >= consensus_code_range[i][0] && custom_ascii[transaction_id[0]] <= consensus_code_range[i][1])
            return consensus_code_range[i];
        }
    }
}

module.exports = ValidatorsCCR;