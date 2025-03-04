# Git Commit Tracking System

An Express Node.js application that tracks Git commits locally and supports syncing commit details to Google Docs.

## Project Structure

```
├── src/
│   ├── app.js                  # Main application file
│   ├── routes/                 # Route definitions
│   ├── controllers/            # Route controllers
│   ├── scripts/                # Utility scripts
│   │   └── process-commit.js   # Processes Git commits
│   ├── utils/                  # Utility modules
│   │   └── googleDocsSync.js   # Google Docs integration
│   ├── models/                 # Data models
│   └── middleware/             # Custom middleware
├── public/                     # Static files (HTML, CSS, JS)
├── logs/                       # Commit logs storage
│   ├── commits.log             # Raw Git commit logs
│   └── processed-commits.log   # Processed commit data
├── .git/hooks/                 # Git hooks
│   └── post-commit             # Captures commit details
├── .env                        # Environment variables
├── .env.example               # Example environment variables
├── google-credentials-template.json # Template for Google API credentials
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

## Features

### 1. Local Git Commit Tracking

This system automatically captures detailed information about your Git commits including:

- Committer name and email
- Commit ID and previous commit ID
- Commit message
- Changed files (added, modified, deleted)
- Complete diff output

All this information is stored in log files in the `logs/` directory:
- `commits.log`: Raw commit data captured by the post-commit hook
- `processed-commits.log`: Structured JSON data processed by the Node.js script

### 2. Google Docs Integration

Commit details can be automatically synced to a Google Docs document for collaborative review and tracking:

- All commit information is formatted and appended to a specified Google Docs document
- Commits are timestamped and include full diff information
- Integration is optional and configurable

### 3. API Endpoints

The system also includes a backend API with endpoints:

- `GET /`: Welcome message
- `POST /api/webhook`: Webhook endpoint for AI content generation (OpenAI integration)

## Setup Instructions

### Initial Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

4. Edit the `.env` file to add your OpenAI API key (for AI features) and Google Docs settings (for commit syncing)

### Google Docs Integration Setup

To enable syncing commit details to Google Docs:

1. Create a Google Cloud project and enable the Google Docs API
2. Create a service account and download the credentials JSON file
3. Share your target Google Doc with the service account email (with edit permissions)
4. Update your `.env` file with:
   - `GOOGLE_DOCS_ID`: The ID of your Google Doc (from the URL)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your credentials JSON file

### Git Hook Installation

The post-commit hook is automatically installed in `.git/hooks/`. To verify it's working:

1. Make a commit to your repository
2. Check the `logs/` directory for the commit details

## Usage

### Running the Server

Start the development server:

```bash
npm run dev
```

For production:

```bash
npm start
```

### Working with Git

Just use Git normally! Every time you make a commit:

1. The post-commit hook captures commit details
2. The information is stored in log files
3. If configured, the details are synced to Google Docs

### OpenAI Integration

The system also includes OpenAI API integration:

1. Set up your OpenAI API key in the `.env` file
2. Use the `/api/webhook` endpoint for AI content generation

## License

This project is licensed under the ISC License.
