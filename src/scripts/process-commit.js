#!/usr/bin/env node

/**
 * Commit Processing Script
 * 
 * This script processes commit information captured by the post-commit hook
 * and can sync the information to Google Docs.
 * 
 * Usage: node process-commit.js <commit-id> <previous-commit> <committer-name> <committer-email> <commit-message>
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');

// Constants
const LOGS_DIR = path.join(__dirname, '../../logs');
const PROCESSED_LOG_FILE = path.join(LOGS_DIR, 'processed-commits.log');

// Check if we need to install googleapis if it's not already installed
try {
  require.resolve('googleapis');
} catch (e) {
  console.log('Installing googleapis dependency...');
  try {
    execSync('npm install googleapis --no-save', { stdio: 'inherit' });
    console.log('googleapis installed successfully!');
  } catch (error) {
    console.error('Failed to install googleapis, continuing without Google Docs sync');
  }
}

/**
 * Main function to process commit details
 */
async function processCommit() {
  try {
    // Parse command line arguments
    const [commitId, previousCommit, committerName, committerEmail, ...commitMsgParts] = process.argv.slice(2);
    const commitMessage = commitMsgParts.join(' ');
    
    if (!commitId) {
      console.error('Missing commit ID argument');
      process.exit(1);
    }
    
    console.log(`Processing commit: ${commitId}`);
    
    // Get more detailed information about the commit using git commands
    let repoRoot, filesChanged, diff;
    
    try {
      repoRoot = execSync('git rev-parse --show-toplevel').toString().trim();
    } catch (error) {
      console.warn('Could not determine git repository root:', error.message);
      repoRoot = process.cwd();
    }
    
    try {
      filesChanged = execSync(`git diff-tree --no-commit-id --name-status -r ${commitId}`).toString();
    } catch (error) {
      console.warn('Could not retrieve changed files:', error.message);
      filesChanged = '';
    }
    
    try {
      diff = execSync(`git show ${commitId} --color=never`).toString();
    } catch (error) {
      console.warn('Could not retrieve diff:', error.message);
      diff = 'Diff unavailable';
    }
    
    // Format commit information
    const commitInfo = {
      id: commitId,
      previousCommit,
      committer: {
        name: committerName,
        email: committerEmail
      },
      message: commitMessage,
      timestamp: new Date().toISOString(),
      filesChanged: filesChanged.split('\n').filter(Boolean).map(line => {
        const [status, file] = line.split('\t');
        return { status, file };
      }),
      diff
    };
    
    // Log formatted information for processing
    await logProcessedCommit(commitInfo);
    
    // Attempt to sync with Google Docs if configured
    await syncToGoogleDocs(commitInfo);
    
    console.log('Commit processing complete');
    
  } catch (error) {
    console.error('Error processing commit:', error);
    process.exit(1);
  }
}

/**
 * Log processed commit information to file
 */
async function logProcessedCommit(commitInfo) {
  try {
    // Create logs directory if it doesn't exist
    await fs.mkdir(LOGS_DIR, { recursive: true });
    
    // Format the commit information for logging
    const logEntry = JSON.stringify(commitInfo, null, 2);
    
    // Write to log file
    await fs.appendFile(PROCESSED_LOG_FILE, logEntry + '\n\n', 'utf8');
    
    console.log(`Commit information saved to ${PROCESSED_LOG_FILE}`);
  } catch (error) {
    console.error('Error logging processed commit:', error);
    throw error;
  }
}

/**
 * Sync commit information to Google Docs
 */
async function syncToGoogleDocs(commitInfo) {
  try {
    // Check if Google Docs is configured
    const googleDocsId = process.env.GOOGLE_DOCS_ID;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!googleDocsId || !credentialsPath) {
      console.log('Google Docs integration not configured. Skipping sync.');
      return;
    }
    
    console.log('Attempting to sync with Google Docs...');
    
    try {
      // Check if credentials file exists
      await fs.access(credentialsPath);
    } catch (err) {
      console.warn(`Google credentials file not found at ${credentialsPath}`);
      return;
    }
    
    // Initialize auth client
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/documents'],
    });
    
    // Initialize docs client
    const docs = google.docs({ version: 'v1', auth });
    
    // Format content for Google Docs
    const content = formatCommitForDocs(commitInfo);
    
    // First get the document to find the end position
    const doc = await docs.documents.get({ documentId: googleDocsId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;
    
    // Append text to the document
    await docs.documents.batchUpdate({
      documentId: googleDocsId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndex - 1,
              },
              text: content,
            },
          },
        ],
      },
    });
    
    console.log('Successfully synced commit information to Google Docs');
    
  } catch (error) {
    console.error('Error syncing to Google Docs:', error);
    // Don't throw error to prevent script failure
    // Just log the error and continue
  }
}

/**
 * Format commit information for Google Docs
 */
function formatCommitForDocs(commitInfo) {
  const { id, previousCommit, committer, message, timestamp, filesChanged, diff } = commitInfo;
  
  let content = '';
  content += '==================== COMMIT DETAILS ====================\n';
  content += `Committer: ${committer.name} <${committer.email}>\n`;
  content += `Commit ID: ${id}\n`;
  content += `Previous Commit: ${previousCommit}\n`;
  content += `Date: ${timestamp}\n`;
  content += `Message: ${message}\n\n`;
  
  content += '============ CHANGED FILES ============\n';
  for (const file of filesChanged) {
    const statusSymbol = file.status === 'A' ? '+' : file.status === 'D' ? '-' : '~';
    content += `${statusSymbol} ${file.file}\n`;
  }
  content += '\n';
  
  content += '============ DIFF OUTPUT ============\n';
  content += diff;
  content += '\n';
  content += '===========================================\n\n';
  
  return content;
}

// Execute the main function
processCommit();
