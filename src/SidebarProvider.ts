import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import axios from "axios";
import ignore from "ignore";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri, ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        // Update the generatePlan case in your SidebarProvider
        case "generatePlan": {
          const userPrompt = data.value;
          if (!userPrompt) {
            vscode.window.showErrorMessage("Please enter a plan description");
            return;
          }

          try {
            const workspaceContent = await this.getWorkspaceStructure();
            const config = vscode.workspace.getConfiguration("codePlanner");
            const apiKey = config.get<string>("openRouterApiKey");

            if (!apiKey) {
              vscode.window.showErrorMessage(
                "OpenRouter API key not found. Please set it in extension settings."
              );
              return;
            }

            console.log(workspaceContent)

            const response = await axios.post(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                model: "deepseek/deepseek-r1-distill-llama-70b:free",
                messages: [
                  {
                    role: "user",
                    content: `Create a code plan based on: ${userPrompt}. 
                               Current workspace structure: ${workspaceContent}.
                               Only respond with html list of tasks, and nothing else.`,
                  },
                ],
                temperature: 0.7,
                max_tokens: 1000,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "HTTP-Referer": "https://your-extension-repo.com", // Update with your extension's URL
                  "X-Title": "Task Assist Extension",
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(response.data);

            const plan = response.data.choices[0].message.content;
            this._view?.webview.postMessage({
              type: "showPlan",
              value: plan,
            });
          } catch (error) {
            console.error(error);
            vscode.window.showErrorMessage(`Error generating plan: ${error}`);
          }
          break;
        }
      }
    });
  }

  private async getWorkspaceStructure(): Promise<string> {
    // Define a glob for relevant file extensions.
    const globPattern = "**/*.{js,ts,jsx,tsx,json,css,html}";
  
    // Exclude common folders.
    const excludeGlob = "**/{node_modules,.git,dist,build}/**";
  
    // Get all matching files from the workspace.
    const files = await vscode.workspace.findFiles(globPattern, excludeGlob);
  
    // Attempt to load .gitignore patterns.
    let gitignorePatterns: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const gitignoreUri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".gitignore");
      try {
        const gitignoreContent = await vscode.workspace.fs.readFile(gitignoreUri);
        // Convert Uint8Array to string and split into lines.
        const gitignoreString = Buffer.from(gitignoreContent).toString("utf8");
        gitignorePatterns = gitignoreString
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"));
      } catch (error) {
        // If .gitignore doesn't exist or cannot be read, ignore it.
      }
    }
  
    // Create an ignore filter using the parsed patterns.
    const ig = ignore().add(gitignorePatterns);
  
    // Filter out files that match any .gitignore patterns.
    const filteredFiles = files.filter((file) => {
      const relativePath = vscode.workspace.asRelativePath(file);
      return !ig.ignores(relativePath);
    });
  
    // Return the filtered file list as a newline-separated string.
    return filteredFiles.map((f) => vscode.workspace.asRelativePath(f)).join("\n");
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</head>
      <body>
				
			</body>
			</html>`;
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }
}
