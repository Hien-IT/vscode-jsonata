import jsonata = require("jsonata");
import * as vscode from "vscode";
import CompletionProvider from "./language/CompletionProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["jsonata"],
      new CompletionProvider(),
      "$"
    )
  );

  let document1: vscode.TextDocument;
  let document2: vscode.TextDocument;
  let document3: vscode.TextDocument;
  let document4: vscode.TextDocument;

  const disposable = vscode.commands.registerCommand(
    "extension.queryJSONata",
    async () => {
      const editor1 = vscode.workspace.openTextDocument({
        content: "{}",
      });
      const editor2 = vscode.workspace.openTextDocument({
        content: "{}",
      });
      const editor3 = vscode.workspace.openTextDocument({
        content: "{}",
      });
      const editor4 = vscode.workspace.openTextDocument({
        content: "function a(){}",
      });

      editor1.then((document) => {
        document1 = document;
        vscode.window.showTextDocument(document, {
          viewColumn: vscode.ViewColumn.Two,
        });
        vscode.languages.setTextDocumentLanguage(document, "json");
      });

      editor2.then(async (document) => {
        document2 = document;

        vscode.window.showTextDocument(document, {
          viewColumn: vscode.ViewColumn.One,
        });

        vscode.languages.setTextDocumentLanguage(document, "jsonata");
      });

      editor3.then((document) => {
        document3 = document;
        vscode.window.showTextDocument(document, {
          viewColumn: vscode.ViewColumn.Three,
        });
        vscode.languages.setTextDocumentLanguage(document, "json");
      });

      editor4.then((document) => {
        document4 = document;
        vscode.window.showTextDocument(document, {
          viewColumn: vscode.ViewColumn.Four,
        });
        vscode.languages.setTextDocumentLanguage(document, "typescript");
      });

      await vscode.commands.executeCommand(
        "workbench.action.editorLayoutTwoRows"
      );
    }
  );

  const onTextChange = vscode.workspace.onDidChangeTextDocument(
    async (event) => {
      if (event.document === document1 || event.document === document2) {
        parseJson(document1, document2, document3, document4);
      }
    }
  );

  context.subscriptions.push(onTextChange);
  context.subscriptions.push(disposable);
}

async function preview(text: unknown, document: vscode.TextDocument) {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(0, 0, document.lineCount, 0),
    JSON.stringify(text, null, 2)
  );
  await vscode.workspace.applyEdit(edit);
}

function isJson(data: string) {
  try {
    JSON.parse(data);
  } catch {
    return false;
  }
  return true;
}

async function parseJson(
  document1: vscode.TextDocument,
  document2: vscode.TextDocument,
  document3: vscode.TextDocument,
  document4: vscode.TextDocument
) {
  try {
    let text1 = document1.getText();
    text1 = text1.replace(/(\r\n|\n|\r)/gm, "");

    let text2 = document2.getText();
    text2 = text2.replace(/(\r\n|\n|\r)/gm, "");

    if (!text2 || !text1) {
      await preview("", document3);
      return;
    }

    if (!isJson(text1)) {
      await preview(
        {
          error: "Invalid JSON",
        },
        document3
      );
      return;
    }

    const expressionBody = jsonata(text2);
    const text4 = document4.getText().replace(/(\r\n|\n|\r)/gm, "");
    const listFunc = text4.split("'$'");

    listFunc.map((func) => {
      const register = registerFunction(func);
      if (register) {
        const listArgs = register.args.split(",");
        expressionBody.registerFunction(
          register.name ?? "",
          register.func as any
        );
      }
    });

    expressionBody
      .evaluate(JSON.parse(text1))
      .then(async (result) => {
        await preview(result, document3);
      })
      .catch(async (err) => {
        await preview(
          {
            error: "Invalid Jsonata",
          },
          document3
        );
      });
  } catch {}
}
function registerFunction(text: string) {
  const funcReg = /function\s+(\w+)\s*\(([^)]*)\)\s*{\s*([^}]*)\s*}/;

  const match = text.match(funcReg);

  if (!match) {
    return null;
  }

  const functionName = match[1];
  const args = match[2];
  const body = match[3].trim();

  const result = {
    name: functionName,
    args: args,
    body: "{" + body + "}",
    func: new Function(args, body),
  };

  return result;
}

export function deactivate() {}
