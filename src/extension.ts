import * as fs from 'fs';

import * as yaml from 'yaml';

import * as vscode from 'vscode';


export class DefinitionProvider {
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const importLine = document.lineAt(position).text
    const word = document.getText(document.getWordRangeAtPosition(position)).split(/\r?\n/)[0];
    const varRe = "\\$\\{.*" + word.replace(".", "\\.") + ".*\\}"
    const wordVarMatches = importLine.match(varRe)
    let locations: Array<vscode.Location> = [];

    if (importLine.includes("call: ") || importLine.includes("flow: ") || importLine.includes("entryPoint: ")) {
      const flowFlag = "  " + word + ":"

      let rootPath: string | undefined
      if (vscode.workspace.workspaceFolders !== undefined) {
        rootPath = vscode.workspace.workspaceFolders[0].uri.path
      } else {
        vscode.window.showErrorMessage("CONCORD-GOTO: Working folder not found, open a folder an try again")
        return undefined
      }

      try{
        const filesInDirectory = fs.readdirSync(rootPath, {
          encoding: "utf-8",
          recursive: true
        })
        for (const file of filesInDirectory) {
          const absolute = rootPath + "/" + file
          if (!fs.statSync(absolute).isDirectory() && (absolute.endsWith("concord.yaml") || absolute.endsWith("concord.yml"))) {
            // TODO: use async -> import { readFile } from 'fs/promises';
            const fileContent: string[] = fs.readFileSync(absolute, 'utf-8').split(/\r?\n|\r|\n/g)
            for (let lineIndex: number = 0; lineIndex < fileContent.length; lineIndex++) {
              const lineContent: string = fileContent[lineIndex]
              const charIndex: number = lineContent.indexOf(flowFlag)
              if (charIndex >= 0 && lineContent.trimEnd() === flowFlag) {
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
    } else if (wordVarMatches !== null && wordVarMatches.length > 0) {  // we are clicking a variable ${var}
      const text = document.getText()
      const textDict = yaml.parse(text)
      const fileArguments = textDict.configuration.arguments
      const lines = text.split(/\r?\n|\r|\n/g)
      let argumentsKeys = new Map<string, vscode.Position>();
      let inConfiguration = false
      let inArguments = false
      let keyPrefixTokens: string[] = []
      let prevKey = ""
      let lineNum = -1
      for (const line of lines) {
        lineNum += 1
        if (line === "configuration:" && inConfiguration === false) {
          inConfiguration = true
        } else if (inConfiguration === true && line === "  arguments:") {
          inArguments = true
        } else if (inArguments === true) {
          // discard comments
          if (line.trim().startsWith("#")) { continue }
          // discard blank lines
          if (line.length === 0) { continue }
          // break if finds a line that's not part of arguments
          if (line.substring(0, 4) !== "    ") { break }

          // get indent levels
          const currentKey = line.trim().split(":")[0].replace("- ", "").replaceAll("\"", "")  // lists items start with "- "
          const prevIndentLevel = keyPrefixTokens.length
          let currIndentLevel = 0
          let charPos
          for (charPos = 4; charPos < line.length; charPos+=2) {  // starts at pos 3, it has already 2 indentations
            if (line[charPos] !== " ") {break}
            currIndentLevel += 1
          }

          // update prefix tokens
          if (currIndentLevel > prevIndentLevel) {
            keyPrefixTokens.push(prevKey)
          } else if (currIndentLevel < prevIndentLevel) {
            keyPrefixTokens.pop()
          }

          // update keys map
          const pos = new vscode.Position(lineNum, charPos)
          const keyStr = keyPrefixTokens.concat([currentKey]).join(".")
          argumentsKeys.set(keyStr, pos)

          prevKey = currentKey
        }
      }

      const pos = argumentsKeys.get(word)
      if (pos !== undefined) { locations.push(new vscode.Location(document.uri, pos)) }
      else {
        for (const [key, pos] of argumentsKeys) {
          if (key.includes(word) && importLine.includes(key)) {
            locations.push(new vscode.Location(document.uri, pos))
          }
        }
      }
      // TODO: "set: " vars in the same flow    +    global vars

    }
    return locations
  }
}

export class HoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const word = document.getText(document.getWordRangeAtPosition(position));
    let text: string = ''
    // text += word
    const contents = new vscode.MarkdownString(text);
    contents.isTrusted = true;
    return new vscode.Hover(contents);
  }
}


export function activate(context: vscode.ExtensionContext) {

  const schema = {
    scheme: 'file',
    language: 'yaml'
  }

  const definitionProvider = new DefinitionProvider(context)
  const definitionProviderRegistered = vscode.languages.registerDefinitionProvider(
    schema,
    definitionProvider
  )
  context.subscriptions.push(definitionProviderRegistered)

  const hoverProvider = new HoverProvider()
  let hoverProviderRegistered = vscode.languages.registerHoverProvider(
    schema,
    hoverProvider
  );
  context.subscriptions.push(hoverProviderRegistered);

}

export function deactivate() {}
