class Validators {
    constructor() {
        this.validators = [];
        
    }

    addValidator(validatorId) {
        const ind = this.validators.indexOf(validatorId);
        if(ind === -1) {
            this.validators.push(validatorId);
        } else {
            this.validators.splice(ind,1);
        }
    }
     
}

module.exports = Validators;