const Base = require('./base')
const vscode = require('vscode')
const ERRORS = require('../error_messages.js')

class Engine extends Base {
    constructor() {
        super(['python'], 'https://pypi.org/pypi/%package%/json', ['docs_url', 'home_page'])
    }
    
    /**
    * 
    * @param {string} packageName 
    * @returns {any}
    */

    async _getPackageInfo (packageName) {
        const res = await super._getPackageInfo(packageName);
        if (res === false) {
            return "https://docs.python.org/library/%packageName%.html".replace('%packageName%', packageName);
        }
        return res;
    }
    /**
     * 
     * @param {string} selectedText 
     */

    async _getPackageName(selectedText) {
        
        const reguraisedText = selectedText.trim();
        if (reguraisedText.indexOf('.') === 0) {
            return ERRORS.AppCode;
            
        }
        const editor =  vscode.window.activeTextEditor;
        let searches = editor.document.uri.path.split('/');
        searches.pop();
        searches.unshift('');
       
        const head = reguraisedText.split('.')[0];
         
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri).uri;

    
       
        let cands = [];
        


        for (const search of searches) {
            cands.push(search);
            let dir = './' + cands.join('/')
           
            let target = vscode.Uri.joinPath(workspaceFolder, dir)

            let results = await vscode.workspace.fs.readDirectory(target)

            for (let result of results) {
                let [name, fileType] = result;

                if ((name === head && fileType === vscode.FileType.Directory) || (name === head + '.py' && fileType === vscode.FileType.File)) {
                    return  ERRORS.AppCode;
                }
            }
        }
        return head;
    }
}

module.exports = Engine;