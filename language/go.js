const Base = require('./base');
const QUATE = /(["'])(.+)?\1/;
const NOT_CLOSE_PT = /["'][^"'\s]+ | [^"'\s]+["']/;
const CLOSER_PT = /["']/g;
const ERRORS = require('../error_messages.js');

class Engine extends Base {
    constructor(){
        super(['go'], '', '');
    }
    /**
     * 
     * @param {string} selectedText 
     */
    readReadme(selectedText) {

        let reguraisedText;
        const allOver = QUATE.exec(selectedText)

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
        const dotPosition = reguraisedText.indexOf('.') 
        if (dotPosition === 0) {
            return ERRORS.AppCode;
        } else if (dotPosition === -1) {
            reguraisedText = 'https://pkg.go.dev/' + reguraisedText;
           

        }
        else {
            reguraisedText = 'http://' + reguraisedText;
        }
        

        console.log('reguraisedText:' + reguraisedText);
        return this.openReadme(reguraisedText);
    }

}

module.exports = Engine;