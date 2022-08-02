const vscode = require('vscode')
const Base = require('./base')
const {TextDecoder} = require('node:util')

const ERRORS = require('../error_messages.js');

const SPLIT_LINE = /\r\n|\n/;
const ARROW = '=>'
const QUATATION = /(["'])(.+)?\1/;
const REGURAIZE_PT = /^\\|\\$/;


const INSTALLED_JSON = './vendor/composer/installed.json';
const COMPOSER_JSON = './composer.json'

let HOMEPAGES;

/**
 * @types {string[]}
 */
let APPCODES;

/**
 * @type {vscode.Uri}
 */
let VENDOR_URI

/**
 * @type {number}
 */
let VENDOR_UPDATE

class Engine extends Base {
    constructor () {
        super(['php'], '', ['']);
        
    }
    /**
     * 
     * @param {string} selectedText 
     * @returns {Promise<any>}
     */
    async readReadme (selectedText) {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            console.log('no editor')
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri).uri;
        let isNew = !VENDOR_URI || VENDOR_URI.path.indexOf(workspaceFolder.path) === -1;
        
        if (isNew === true) {

            VENDOR_URI = await searchVender();
        }
       
       
        const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(VENDOR_URI, INSTALLED_JSON))
        isNew = isNew || stat.mtime !== VENDOR_UPDATE;
        if (isNew === true) {
            VENDOR_UPDATE = stat.mtime;
                   
            const installedJsonString =  await readFile(VENDOR_URI, INSTALLED_JSON);
            
            HOMEPAGES = await parseInstalledJson(VENDOR_URI, installedJsonString);
            const composerJsonString = await readFile(VENDOR_URI, COMPOSER_JSON);
            APPCODES = []  
            let autoloadMapList =  Object.values(JSON.parse(composerJsonString).autoload || {})
            for (let autoloadMap of autoloadMapList) {
                APPCODES = APPCODES.concat(Object.keys(autoloadMap).map(function (value) {
                    return _reguraizeNameSpace(value);

                }))
                
            }





        }
         
        const reguraisedText= _reguraizeNameSpace(selectedText.trim()).split('(')[0]
        let homePageURL; 
        for (let appcode of APPCODES) {
            if (reguraisedText === appcode || reguraisedText.indexOf(appcode) === 0) {
                return ERRORS.AppCode;
            }
        }

        for (let canditate  of Object.keys(HOMEPAGES)) {
            if (reguraisedText === canditate || reguraisedText.indexOf(canditate) === 0 ) {
                homePageURL = HOMEPAGES[canditate] 
            }
        }
        if (!homePageURL) {
            
            const urlSafe = reguraisedText.replace(/\\/g, '-').replace(/_/g, '-').toLowerCase();
            
            let tokenType;
            let urlTemplate = 'https://www.php.net/manual/%tokenType%.%urlSafe%.php';
            if (reguraisedText !== reguraisedText.toLowerCase()) {

                tokenType = 'class';
            }
            else {
                tokenType = 'function';
            }
            
            homePageURL = urlTemplate.replace('%tokenType%', tokenType).replace('%urlSafe%', urlSafe);




           
            
            

        }
        return this.openReadme(homePageURL)

    }
}



async function searchVender() {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        console.log('no editor')
        return;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri).uri;
    let searches = editor.document.uri.path.replace(workspaceFolder.path, '').replace(/^\//,'').split('/')
   
    searches.pop()
    searches.unshift('.')
    let cands = [];
    let isFirst = false
   
    
    for (const search of searches) {
        cands.push(search)
        let dir =  cands.join('/')
        if (isFirst === true) {
            dir += '/';
            isFirst = false;
        }
        let target = vscode.Uri.joinPath(workspaceFolder, dir)
        
        let results = await vscode.workspace.fs.readDirectory(target)
        
        for (let result of results) {
            let [name, fileType ] = result;
            
            if (name === 'vendor' && fileType === vscode.FileType.Directory) {
                return target;
            }
        }
    }

   
}

/**
 * 
 * @param {vscode.Uri} basePath 
 * @param {string} uri 
 */
async function readFile(basePath, uri) {
    const fileUri = vscode.Uri.joinPath(basePath, uri);
    
    return new TextDecoder().decode(await vscode.workspace.fs.readFile(fileUri))
}


/**
 * 
 * @param {string} jsonString 
 */

async function parseInstalledJson(basePath, jsonString){
    const installeds = JSON.parse(jsonString).packages;
    let homePages = {};
    let filesCanditate = {};
    let classmapCanditate = {};
    let isFilesCanditateExist = false
    let isClassmapCanditateExist = false;
    for (let installed of installeds) {
        const name = installed.name;
      
        const homePage = installed.homepage || 'https://packagist.org/packages/' + name;
        for (let installType of Object.keys(installed.autoload)) {
            if (installType.indexOf('psr') !== -1) {
                let installMap = installed.autoload[installType]
                for (let cName in installMap) {
                    if (Object.hasOwnProperty.call(installMap, cName)) {                  
                        homePages[_reguraizeNameSpace(cName) ] = homePage;                 
                    }
                } 
            }
            if (installType === 'files' || installType === 'classmap') {
                let target;
                if (installType === 'files') {
                    isFilesCanditateExist = true;
                    target = filesCanditate;
                }
                else {
                    isClassmapCanditateExist = true;
                    target = classmapCanditate;
                }
                for (let candPath of installed.autoload[installType]) {
                    let canditate = ('/' + name + '/' + candPath).replace('//', '/');
                    target[canditate] = homePage
                }
                
            }
            
        }

        

        
        
    }
    
    if (isFilesCanditateExist|| isClassmapCanditateExist) {
        let canditateList = [];
        if (isFilesCanditateExist) {
            canditateList.push({ php:'./vendor/composer/autoload_files.php', canditates:filesCanditate});
        }
        if (isClassmapCanditateExist) {
            canditateList.push({ php:'./vendor/composer/autoload_classmap.php', canditates:classmapCanditate});
        }
        for (let canditatePaire of canditateList) {
            let {php, canditates} = canditatePaire;
            let code = await readFile(basePath, php);
            const fileToClass = parseAutoloadPHP(code);
            
                
            
            for (let file in  fileToClass) {
                
                let clsString = fileToClass[file]
                for (let cPath in canditates) {
                    
                    if ( file.indexOf(cPath) === 0){
                        
                        homePages[_reguraizeNameSpace(clsString)]  = canditates[cPath];
                        break;
                    }

                }
                
            }
        }

        
    }
    return homePages;
}

module.exports = Engine;
/**
 * 
 * @param {string} code 
 */

function parseAutoloadPHP(code) {
   
    const lines = code.split(SPLIT_LINE).filter(function(row){
        return row.indexOf(ARROW) != -1;
    })
    let fileToClass = {}


    for (const line of lines) {
        const [left, right] = line.split(ARROW);
        const className = _creanUpBackslash(QUATATION.exec(left)[2])
        const filePath = QUATATION.exec(right)[2];
        fileToClass[filePath] = className;
    }
    
    return fileToClass;

}
/**
 * 
 * @param {string} target 
 */

function _creanUpBackslash (target) {
    return target.replace('\\\\', '\\');
}

/**
 * 
 * @param {string} target 
 */
function _reguraizeNameSpace (target) {
    return target.replace(REGURAIZE_PT,'');
}