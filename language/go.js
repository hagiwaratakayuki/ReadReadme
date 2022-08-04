
const vscode = require('vscode');
const {TextDecoder} = require('node:util')
const Base = require('./base');
const QUATE = /(["'])(.+)?\1/;
const NOT_CLOSE_PT = /["'][^"'\s]+ | [^"'\s]+["']/;
const CLOSER_PT = /["']/g;
const ERRORS = require('../error_messages.js');


let UPDATE;
let GO_MOD_PATH;

let REPLACE_MAP;
let IS_GO_PATH = false;


class Engine extends Base {
    constructor(){
        super(['go'], '', '');
    }
    /**
     * 
     * @param {string} selectedText 
     */
    async readReadme(selectedText) {

        let reguraisedText;
        const allOver = QUATE.exec(selectedText)

        if (allOver) {

            reguraisedText = allOver[2];
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
        reguraisedText = reguraisedText.replace(/\\$/, '');
        const dotPosition = reguraisedText.indexOf('.') 
        if (dotPosition === 0) {
            return ERRORS.AppCode;
        } else if (dotPosition === -1) {
            reguraisedText = 'https://pkg.go.dev/' + reguraisedText;
           

        }
        else {
            

            const stat = await vscode.workspace.fs.stat(GO_MOD_PATH);
            let isUpdated = UPDATE == false || UPDATE < stat.mtime;
            UPDATE = stat.mtime;
            if (isUpdated === true) {
                if (!GO_MOD_PATH) {
                    GO_MOD_PATH = await this.searchGoMod();
                }
            
                if (GO_MOD_PATH !== false) {
                    IS_GO_PATH = false;
                    
                }
                if (IS_GO_PATH === false) {
                    const lines =  new TextDecoder().decode(await vscode.workspace.fs.readFile(GO_MOD_PATH)).split(/\r|\r\n|\n/)
                   
                    REPLACE_MAP = {};
                    

                    for (let line of lines) {
                        let trimed = line.trim()   

                        
                        
                        if (trimed.includes('replace') === 0) {
                            
                            trimed = trimed.replace('replace', '');
                                                  
                            let { left, right } = trimed.replace('replace', '').trim().split(/\s*=>\s*/)
                            let baseVersion = left.trim().split(/\s+/)[0].replace(/\\$/, '');
                            let replace = right.trim().split(/\s+/)[0];
                            REPLACE_MAP[baseVersion] = replace;
                                
                            
                        }

                        
                    }
                }
                
            }
            if (IS_GO_PATH === false) {
                
                for (let baseVersion of Object.keys(REPLACE_MAP)) {
                    let check = reguraisedText.replace(baseVersion, '');
                    if (!check || check.indexOf('/') === 0) {
                        let replace = REPLACE_MAP[baseVersion];
                        if (replace.indexOf('.') === 0) {
                            return ERRORS.AppCode;
                        }
                        reguraisedText = replace;
                        
                        break;
                    }
                }
               

            }
            
            if (reguraisedText.includes('github.com') || reguraisedText.includes('gitlab.com')) {
                reguraisedText = /(github.com|gitlab.com)\/[^/]+\/[^/]+\//.exec(reguraisedText)[0]; 
                
            }    
                
            
            
            reguraisedText = 'http://' + reguraisedText;
        }
        

        console.log('reguraisedText:' + reguraisedText);
        return this.openReadme(reguraisedText);
    }
    async  searchGoMod() {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            console.log('no editor')
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri).uri;
        let searches = editor.document.uri.path.replace(workspaceFolder.path, '').replace(/^\//, '').split('/')

        searches.pop()
        searches.unshift('.')
        let cands = [];
        let isFirst = false


        for (const search of searches) {
            cands.push(search)
            let dir = cands.join('/')
            if (isFirst === true) {
                dir += '/';
                isFirst = false;
            }
            let target = vscode.Uri.joinPath(workspaceFolder, dir)

            let results = await vscode.workspace.fs.readDirectory(target)

            for (let result of results) {
                let [name, fileType] = result;

                if (name === 'go.mod' && fileType === vscode.FileType.File) {
                    return vscode.Uri.joinPath(target, './go.mod');
                }
            }
        }
        return false;


    }

}

module.exports = Engine;