/**
 * Grok Service
 * handles communication with the xAI API
 */

// Import the model constant to allow for easy budget switching
import { GROK_MODEL } from '../constants';

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

// Vite environment variable access
const API_KEY = import.meta.env.VITE_XAI_API_KEY || ""; 

/**
 * Message interface used across the app
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GrokResponse {
  choices?: {
    message?: {
      content: string;
      role?: string;
    };
    finish_reason?: string;
  }[];
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Sends messages to the xAI API and returns the assistant's response.
 * Uses the GROK_MODEL from constants for cost control.
 */
export const sendMessage = async (
  messages: Message[], 
  projectContext: string = ""
): Promise<string> => {
  
  // 1. Validation for API Key
  if (!API_KEY) {
    const msg = "Missing VITE_XAI_API_KEY. Please check your .env file.";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    /**
     * BUDGET OPTIMIZATION:
     * We keep the system instruction concise. 
     * Shorter system prompts save money on every single request.
     */
    const systemContent = `You are ${GROK_MODEL}, an expert AI developer. ${
      projectContext ? `Context: ${projectContext}.` : ""
    } Provide expert-level code solutions using markdown.`;

    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL, 
        messages: [
          {
            role: "system",
            content: systemContent
          },
          ...messages
        ],
        stream: false,
        temperature: 0, // Zero temperature ensures stable, reproducible code
      }),
    });

    // 2. Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as GrokResponse;
      const errorMsg = errorData.error?.message || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json() as GrokResponse;

    // 3. Debug logging for empty choices
    if (!data.choices || data.choices.length === 0) {
      if (data.error) {
        throw new Error(`API Error Object: ${data.error.message}`);
      }
      throw new Error("API returned success but 'choices' was empty.");
    }

    // 4. Content safety check
    const choice = data.choices[0];
    if (choice.finish_reason === 'content_filter') {
      throw new Error("The response was omitted due to content filters.");
    }

    // 5. Extract and return content
    const content = choice.message?.content;

    if (content === undefined || content === null) {
      throw new Error("The API returned success but message content was missing.");
    }

    return content;

  } catch (error: any) {
    console.error("Grok Service Error:", error);
    throw new Error(error.message || "A connection error occurred while talking to Grok.");
  }
};