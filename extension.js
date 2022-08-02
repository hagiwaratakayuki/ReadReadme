

const vscode = require('vscode');


const languageMap = require('./language/index.js')
const ERRORS = require('./error_messages')

const i18nMap = {
	'default': require('./package.nls.json'),
	'ja':require('./package.nls.ja.json')
}

function getInternationalText(key) {
	return (i18nMap[vscode.env.language] || i18nMap['default'])[key]; 
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('readreadme.readreadme', async function () {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			console.log('no editor');
			return;
		}
		
	
		
		
		try {
			const document = editor.document;
			const selection = editor.selection;
			const selectedText = document.getText(selection);
			console.log(selectedText);
			if (!selectedText) {
				return
			}
			vscode.window.showInformationMessage(getInternationalText('cheking'))

			if (document.languageId in languageMap) {
				const language = languageMap[document.languageId];

				const flag = await language.readReadme(selectedText);

				if (flag === ERRORS.AppCode) {
					vscode.window.showInformationMessage(getInternationalText('app_code').replace('%selectedText%', selectedText))
				}
				if (flag === ERRORS.ServerError) {
					vscode.window.showInformationMessage(getInternationalText('down'))
				}

				if (flag == false) {
					vscode.window.showInformationMessage(getInternationalText('missing').replace('%selectedText%', selectedText))
				}
			}
			
		} catch (error) {

			console.log(error)
			
		}
		
		
				
		
			
		
			
		
		
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
