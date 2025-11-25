# Backend Server

Secure proxy server for Gemini API calls.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from the existing template and add your Gemini API key

3. Run the server:
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Features

- ✅ API key security (hidden from client)
- ✅ Rate limiting (10 requests/minute per IP)
- ✅ CORS configuration
- ✅ Error handling
- ✅ Input validation

## Endpoints

### `POST /api/gemini/generate`
Generate content with Gemini AI

**Request:**
```json
{
  "prompt": "Your prompt here",
  "model": "gemini-2.0-flash-exp"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Generated content",
  "model": "gemini-2.0-flash-exp"
}
```

### `POST /api/gemini/chat`
Chat with conversation history

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi!" },
    { "role": "user", "content": "How are you?" }
  ],
  "model": "gemini-2.0-flash-exp"
}
```

### `GET /health`
Health check endpoint

## Security

- API key stored server-side only
- Rate limiting prevents abuse
- Input validation (max 50,000 characters)
- No sensitive data logged
