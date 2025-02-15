import axios from "axios";

export const getOpenRouterOutput = async (prompt: string, apiKey: string) => {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "google/gemini-2.0-pro-exp-02-05:free",
      messages: [
        {
          role: "user",
          content: `Consider you are a code generation bot that replies ONLY in the specified JSON format (OUTPUT-FORMAT). 
                                  DO NOT include introductions,or additional text. 
                                  Replies must be valid JSON that can successfully parse with JSON.parse() in JavaScript.
    
                                  
                                  ${prompt}
                                   `,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://your-extension-repo.com",
        "X-Title": "Task Assist Extension",
        "Content-Type": "application/json",
      },
    }
  );

  const rawJson = response.data.choices[0].message.content;
  const cleanedJson = rawJson.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanedJson);
};
