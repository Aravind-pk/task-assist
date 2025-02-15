import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import * as fs from "fs";
import * as path from "path";
import { renderTemplate } from "./utils/templaterender";
import { getOpenRouterOutput } from "./utils/llm";
import { getFileContent, getWorkspaceStructure } from "./utils/workspace";
import { analyzeFilesPrompt, planSpesificationPrompt } from "./prompts/tasks";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
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
            const workspaceContent = await getWorkspaceStructure();
            const config = vscode.workspace.getConfiguration("codePlanner");
            const apiKey = config.get<string>("openRouterApiKey");

            if (!apiKey) {
              vscode.window.showErrorMessage(
                "OpenRouter API key not found. Please set it in extension settings."
              );
              return;
            }

            const requieredFiles = await this.getLLMResponse ( analyzeFilesPrompt(userPrompt, workspaceContent));


            this._view?.webview.postMessage({
              type: "showAnalysingPlan",
              value: requieredFiles,
            });

            //get content of files
            const files = await getFileContent(requieredFiles.files);

            const planSpecification = await this.getLLMResponse ( planSpesificationPrompt(userPrompt, files.toString()));

            this._view?.webview.postMessage({
              type: "showPlanSpecification",
              value: planSpecification.steps,
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


  private _getHtmlForWebview(webview: vscode.Webview) {

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const htmlPath = path.join(this._extensionUri.fsPath, "src/webviews", "sidebar.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    // Define all the variables you need to inject.
    const variables = {
      cspSource: webview.cspSource,
      nonce: getNonce(),
      styleResetUri,
      styleVSCodeUri,
    };

    return renderTemplate(html, variables);
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private async getLLMResponse(prompt: string){
    const config = vscode.workspace.getConfiguration("codePlanner");
    const apiKey = config.get<string>("openRouterApiKey");

    if (!apiKey) {
      vscode.window.showErrorMessage(
        "OpenRouter API key not found. Please set it in extension settings."
      );
      return;
    }

    try {
      const response = await getOpenRouterOutput(prompt, apiKey);
      return response;
    }catch(e){
      throw new Error(`Cant get LLM response`);
    }

  }

}
