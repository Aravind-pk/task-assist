import ignore from "ignore";
import * as vscode from "vscode";


  export  const  getWorkspaceStructure = async () =>{
    // Define a glob for relevant file extensions.
    const globPattern = "**/*.{js,ts,jsx,tsx,json,css,html}";

    // Exclude common folders.
    const excludeGlob = "**/{node_modules,.git,dist,build,public}/**";

    // Get all matching files from the workspace.
    const files = await vscode.workspace.findFiles(globPattern, excludeGlob);

    // Attempt to load .gitignore patterns.
    let gitignorePatterns: string[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const gitignoreUri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        ".gitignore"
      );
      try {
        const gitignoreContent = await vscode.workspace.fs.readFile(
          gitignoreUri
        );
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
    return filteredFiles
      .map((f) => vscode.workspace.asRelativePath(f))
      .join("\n");
  }


export const getFileContent = async ( paths:string[]) =>{
    return await Promise.all(paths.map(async (path) => {
      const content = await getFullContentFromRelativePath(path);

      return { path, content };
    }));
}


export async function getFullContentFromRelativePath(relativePath: string): Promise<string> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return "";
  }

  // Construct the URI relative to the first workspace folder.
  const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
  
  try {
    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    return Buffer.from(fileBytes).toString("utf8");
  } catch (err: any) {
    vscode.window.showErrorMessage(`Error reading file: ${err.message || err}`);
    return "";
  }
}
