const Base = require('./base'); 
const ERRORS = require('../error_messages')


const PT = /(["'])(.+)?\1/;
const NOT_CLOSE_PT = /["'][^"'\s]+ | [^"'\s]+["']/;
const CLOSER_PT = /["']/g;

class Engine extends Base {
    constructor() {
        super(['javascript', 'typescript', 'typescriptreact', 'vue', 'svelte'], 'https://registry.npmjs.org/%package%', ['homepage', 'repositry.url'])
    }
    /**
    * 
    * @param {string} packageName 
    * @returns {any}
    */

    async _getPackageInfo(packageName) {
        if (packageName.indexOf('node:') === 0 ) {
            const apiName = packageName.replace('node:', '').split('/')[0];
            return 'https://nodejs.org/api/%api%.html'.replace('apiName', apiName);
        }
        const res = await super._getPackageInfo(packageName);
        return res;
    }
    
    
    
    /**
     * 
     * @param {string} selectedText 
     *  
     */
    
    _getPackageName(selectedText) {
        
        let reguraisedText;
        const allOver = PT.exec(selectedText)
        
        if (allOver) {
            
            reguraisedText = allOver[2]
        }
        else {
            const notClose = NOT_CLOSE_PT.exec(selectedText)
            if (!notClose) {
                reguraisedText = selectedText
            }
            else {
                reguraisedText = notClose[0].replace(CLOSER_PT, '')
            }


        }

        if(reguraisedText.indexOf('.')  === 0 || reguraisedText.indexOf('node') === 0) {
            return ERRORS.AppCode;

        }
        console.log('reguraisedText:' + reguraisedText);
        return reguraisedText
    }
}

module.exports = Engine;

