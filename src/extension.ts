import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {


	console.log('Congratulations, your extension "task-assist" is now active!');


	const sidebarProvider = new SidebarProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("task-assist-sidebar", sidebarProvider)
	  );

	context.subscriptions.push(
		vscode.commands.registerCommand('task-assist.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from task-assist!');
		})
	);
}

export function deactivate() {}
