# Express Node.js Application

A simple Express Node.js application with a structured project setup.

## Project Structure

```
├── src/
│   ├── app.js                  # Main application file
│   ├── routes/                 # Route definitions
│   ├── controllers/            # Route controllers
│   ├── models/                 # Data models
│   └── middleware/             # Custom middleware
├── public/                     # Static files (HTML, CSS, JS)
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
└── package.json                # Project dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

### Production

Start the server in production mode:

```bash
npm start
```

## API Endpoints

- `GET /`: Welcome message
- `POST /api/webhook`: Webhook endpoint for receiving external events and generating AI content

## Webhook Usage

The webhook endpoint accepts POST requests with JSON payloads. Here's an example of how to use it:

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "content_request", "data": {"prompt": "Generate a creative story about space exploration"}}'
```

### Webhook Payload Structure

```json
{
  "event": "content_request",  // Type of event
  "data": {                     // Data specific to the event type
    "prompt": "Your prompt here"
  }
}
```

## OpenAI Integration

This project is set up for OpenAI API integration. To use it:

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key to the `.env` file
3. The webhook endpoint is already configured to process requests and will use OpenAI in the future

## License

This project is licensed under the ISC License.
