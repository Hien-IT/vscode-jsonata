import * as fs from "fs";
import * as vscode from "vscode";

export function activate({
  subscriptions,
  extensionUri,
}: vscode.ExtensionContext) {
  // Create a command to open the new window
  const disposable = vscode.commands.registerCommand(
    "extension.queryJSONata",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "newWindow",
        "New Window",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent(extensionUri);
    }
  );

  subscriptions.push(disposable);
}

function getWebviewContent(extensionUri: any) {
  const bongoRightPath = vscode.Uri.joinPath(
    extensionUri,
    "src/web",
    "index.html"
  );
  return fs.readFileSync(bongoRightPath.fsPath, "utf-8");
}

export function deactivate() {}
