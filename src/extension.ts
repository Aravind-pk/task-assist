import * as vscode from "vscode";
import { SidebarProvider } from "./SidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "task-assist" is now active!');

  const sidebarProvider = new SidebarProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "task-assist-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("task-assist.setApiKey", async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your OpenRouter API Key",
        password: true, // Mask the input
        ignoreFocusOut: true,
      });

      if (apiKey) {
        try {
          await vscode.workspace
            .getConfiguration("codePlanner")
            .update(
              "openRouterApiKey",
              apiKey,
              vscode.ConfigurationTarget.Global
            );
          vscode.window.showInformationMessage("API key saved successfully!");
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to save API key: ${error}`);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("task-assist.helloWorld", () => {
      vscode.window.showInformationMessage("Hello World from task-assist!");
    })
  );
}

export function deactivate() {}
