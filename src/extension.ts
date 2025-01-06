import * as fs from 'fs';

import * as vscode from 'vscode';


export class Provider {
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const start = performance.now()
    const importLine = document.lineAt(position)
    if (importLine.text.includes("call: ") || importLine.text.includes("flow: ")) {
		  const flowName = document.getText(document.getWordRangeAtPosition(position)).split(/\r?\n/)[0];
      const flowFlag = flowName + ":"
      console.log("Flow name: ", flowName)

      let rootPath: string | undefined
      if (vscode.workspace.workspaceFolders !== undefined) {
        rootPath = vscode.workspace.workspaceFolders[0].uri.path
      } else {
        vscode.window.showErrorMessage("CONCORD-GOTO: Working folder not found, open a folder an try again")
        return undefined
      }

      let locations: Array<vscode.Location> = [];
      try{
        const filesInDirectory = fs.readdirSync(rootPath, {
          encoding: "utf-8",
          recursive: true
        })
        for (const file of filesInDirectory) {
          const absolute = rootPath + "/" + file
          if (!fs.statSync(absolute).isDirectory() && (absolute.endsWith(".concord.yaml") || absolute.endsWith(".concord.yml"))) {
            // TODO: use async -> import { readFile } from 'fs/promises';
            const fileContent: string[] = fs.readFileSync(absolute, 'utf-8').split(/\r?\n|\r|\n/g)
            for (let lineIndex: number = 0; lineIndex < fileContent.length; lineIndex++) {
              const lineContent: string = fileContent[lineIndex]
              const charIndex: number = lineContent.indexOf(flowFlag)
              if (charIndex >= 0 && lineContent.trim() === flowFlag) {
                const uri = vscode.Uri.parse(absolute)
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + flowFlag.length)
                const location = new vscode.Location(uri, range)
                locations.push(location)
              }
            }
          }
        }
      } catch(err){
          console.error(err);
      }
      console.log('Time: ', performance.now() - start)
      return locations
    }

    return undefined
  }
}


export function activate(context: vscode.ExtensionContext) {

  const schema = {
    scheme: 'file',
    language: 'yaml'
  }

  const provider = new Provider(context)

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    schema,
    provider
  )

  vscode.window.showInformationMessage('Concord-goto initialized');

  context.subscriptions.push(definitionProvider)
}

export function deactivate() {}
