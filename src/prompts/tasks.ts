export const analyzeFilesPrompt = (
  userPrompt: string,
  workspaceContent: string
) => `
   context: {
    prompt: ${userPrompt}. 
    workspace-structure: ${workspaceContent}.
   }

   you need to mention the files needed to understand the plan better, request 5 to 8 files that are relevant to the plan.

   OUTPUT-FORMAT (important):
   {
    "description": "analyzing demo files (short info)",
    "files": [
      "file1.js",
      "file2.js" 
    ]
    }`;


export const planSpesificationPrompt = (
  userPrompt: string,
  fileContent: string
) => `
   context: {
    outcome: ${userPrompt}. 
    requested-files: ${fileContent}.
   }

   this contains a content of the requested files,
   go through the file content and suggest code changes in DETAIL to achieve the outcome. create in 5 steps.
   keep the stepnames very short and precise but the description as detailed as possible.

   OUTPUT-FORMAT (important):
   {
    "steps": [
      {"stepName": "short step name", "description": "change details"},
      {"stepName": "short step name", "description": "change details"},
    ],
    }`;
