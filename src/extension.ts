import * as vscode from 'vscode';

export class Provider {
  context: vscode.ExtensionContext

  range = new vscode.Range(0, 0, 0, 0)

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const URI = document.uri
    const currentFolder = vscode.Uri.joinPath(URI, '../')
    const importLine = document.lineAt(position)

    console.log('importLine', importLine)
    vscode.window.showInformationMessage("another thing")
    const start = performance.now()
    // const loc = vscode.Location()  // TODO: fill with the correct location
  
    console.log('Time: ', performance.now() - start)

    return undefined
  }
}


export function activate(context: vscode.ExtensionContext) {

  const schema = {
    scheme: 'file',
    language: 'yaml'
  }
  console.log("hei")
  const provider = new Provider(context)

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    schema,
    provider
  )

  vscode.window.showInformationMessage('Not funny');

  context.subscriptions.push(definitionProvider)

}

export function deactivate() {}
