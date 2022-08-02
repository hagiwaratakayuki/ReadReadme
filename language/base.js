const {default:fetch} = require("node-fetch-cjs");
const jusGet = require('just-safe-get');
const os = require('node:os')
const {execSync } = require('node:child_process');
const {TextDecoder} = require('node:util')

const ERRORS = require('../error_messages.js');


const WINDOWS_COMMAND = { command: 'rundll32.exe', option:'url.dll,FileProtocolHandler "%URL%"'};
const MACOS_COMMAND = {command:'open', option: '%URL%'};
const LINUX_COMMAND = {command:'xgd-open', option:'%URL%'};
const IS_WINDOWS =  os.type().toLowerCase().indexOf('windows') !== -1;





const  BROWSER_COMMAND = (function(){
    const t =  os.type().toLowerCase();
    if( t.indexOf('windows') !== -1 || t.indexOf('microsoft') !== -1) {
        return WINDOWS_COMMAND;

    }
    if( t.indexOf('darwin') !== -1) {
        return MACOS_COMMAND;
    }
    return LINUX_COMMAND
})()


class Engine {
    /**
     * vscode languageid. see https://code.visualstudio.com/docs/languages/identifiers
     * @param {string[]} languageIds
     * @param {string} urlTemplate 
     * @param {string | string[]} queries 
     *  
     */

    constructor(languageIds, urlTemplate, queries) {
        this.languageIds = languageIds;
        this.urlTemplate = urlTemplate;
        if (this._isIterable(queries) === false) {
            this.queries = [queries]
        }
        else {
            this.queries = queries;
        }
        
    }
    
    /**
     * 
     * @param {string} selectedText 
     * @returns {any}
     */
    
    async readReadme(selectedText) {
        
        const packageName = await this._getPackageName(selectedText);
        
        if(packageName === false || packageName === ERRORS.AppCode) {
            return packageName;
        }
        console.log('pakage name:' + packageName);
        const readmeURL = await this._getPackageInfo(packageName);
        if (readmeURL === false) {
            return false 
        }
        return this.openReadme(readmeURL);
       



    }
    
    openReadme(readmeURL){
        console.log(BROWSER_COMMAND.command);
        console.log(BROWSER_COMMAND.option.replace('%URL%', readmeURL));
        const command = BROWSER_COMMAND.command + ' ' +  BROWSER_COMMAND.option.replace('%URL%', readmeURL)
        console.log(command);
        const response = execSync(command, {windowsHide:true});
    
          

        
        
        let encoding = 'utf8';
        if (IS_WINDOWS === true) {
            encoding = 'shift-jis';
             
        }
        console.log(new TextDecoder(encoding).decode(response.buffer))
        return true;

    }
    /**
     * 
     * @param {string} packageName 
     * @returns {any}
     */

    async _getPackageInfo(packageName) {
        const apiURL = this._createPackageApiURl(packageName)
        let res
        try {
            res = await fetch(apiURL);    
        } catch (err) {
            return ERRORS.ServerError;
        }
        
        if ( res.ok === false){
            return false
        }
        const json =  await  res.json();
        
        for (const query of this.queries) {
            let searchResult  = jusGet(json, query);
            
            if(searchResult) {

                return searchResult;

            }
            
        }

        return false;
       
        


    }
    /**
     * 
     * @param {string} packageName 
     * @returns {string}
     */
    _createPackageApiURl(packageName) {
        const apiURL = this.urlTemplate.replace('%package%', packageName);
        console.log(apiURL)
        return apiURL;
    }

    /**
     * 
     * @param {string} selectedText 
     * 
     */
    // eslint-disable-next-line no-unused-vars
    async _getPackageName(selectedText)
    {
        throw 'getPackageName does not implmented'
    }

    
    /**
     * @param {any} target
     * @returns {bool}
     */
    _isIterable(target) {

        return target == true && typeof target[Symbol.iterator] === 'function'
        

    }

}

module.exports = Engine