// API Client for backend proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Generate content using Gemini AI via backend proxy
 */
export const generateContent = async (
  prompt: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));

      if (response.status === 429) {
        throw new APIError(
          'Too many requests. Please wait a moment.',
          429,
          'RATE_LIMIT'
        );
      }

      throw new APIError(
        error.error || 'Failed to generate content',
        response.status,
        error.code
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new APIError('Invalid response from server');
    }

    return data.text;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network error or server unavailable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(
        'Cannot connect to server. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new APIError('An unexpected error occurred');
  }
};

/**
 * Chat with Gemini AI using conversation history via backend proxy
 */
export const chatWithGemini = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: string = 'gemini-2.0-flash-exp'
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));

      if (response.status === 429) {
        throw new APIError(
          'Too many requests. Please wait a moment.',
          429,
          'RATE_LIMIT'
        );
      }

      throw new APIError(
        error.error || 'Failed to process chat',
        response.status,
        error.code
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new APIError('Invalid response from server');
    }

    return data.text;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(
        'Cannot connect to server. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new APIError('An unexpected error occurred');
  }
};

/**
 * Check backend health
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};
