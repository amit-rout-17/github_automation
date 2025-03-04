const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');
const googleDocsSync = require('../utils/googleDocsSync');

// Path to store commit logs
const LOGS_DIR = path.join(__dirname, '../../logs');
const COMMITS_LOG_FILE = path.join(LOGS_DIR, 'commits.log');

/**
 * Process GitHub webhook payloads
 * This controller handles incoming GitHub webhook events
 */
exports.handleGithubWebhook = async (req, res) => {
  try {
    // Get GitHub event type from headers
    const githubEvent = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature-256'];
    
    if (!githubEvent) {
      return res.status(400).json({
        success: false,
        message: 'Missing X-GitHub-Event header'
      });
    }
    
    // Validate webhook payload if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET && !verifyGithubWebhook(req.body, signature)) {
      console.warn('Invalid GitHub webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    console.log(`Received GitHub webhook event: ${githubEvent}`);
    
    // Handle different GitHub events
    switch (githubEvent) {
      case 'push':
        await handlePushEvent(req.body);
        break;
      
      // Add other event handlers as needed
      // case 'pull_request':
      //   await handlePullRequestEvent(req.body);
      //   break;
      
      default:
        console.log(`Unhandled GitHub event type: ${githubEvent}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${githubEvent} event`
    });
    
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing GitHub webhook',
      error: error.message
    });
  }
};

/**
 * Handle GitHub push events (commits)
 */
async function handlePushEvent(payload) {
  try {
    const { repository, commits, pusher, after: headCommit, before: previousCommit } = payload;
    
    if (!commits || commits.length === 0) {
      console.log('Push event contains no commits');
      return;
    }
    
    console.log(`Processing ${commits.length} commits from ${pusher.name}`);
    
    // Format commit information
    let commitLog = '';
    
    // Repository info
    commitLog += `Repository: ${repository.full_name}\n`;
    commitLog += `Branch: ${payload.ref.replace('refs/heads/', '')}\n`;
    commitLog += `Pushed by: ${pusher.name} (${pusher.email})\n`;
    commitLog += `Date: ${new Date().toISOString()}\n\n`;
    
    // Process each commit
    for (const commit of commits) {
      commitLog += '='.repeat(80) + '\n';
      commitLog += `Committer: ${commit.committer.name} (${commit.committer.email})\n`;
      commitLog += `Commit ID: ${commit.id}\n`;
      commitLog += `Previous Commit: ${previousCommit}\n`;
      commitLog += `Message: ${commit.message}\n\n`;
      
      // Add modified files
      if (commit.added.length > 0) {
        commitLog += 'Added Files:\n';
        commit.added.forEach(file => commitLog += `  + ${file}\n`);
        commitLog += '\n';
      }
      
      if (commit.modified.length > 0) {
        commitLog += 'Modified Files:\n';
        commit.modified.forEach(file => commitLog += `  ~ ${file}\n`);
        commitLog += '\n';
      }
      
      if (commit.removed.length > 0) {
        commitLog += 'Removed Files:\n';
        commit.removed.forEach(file => commitLog += `  - ${file}\n`);
        commitLog += '\n';
      }
      
      // Note: Detailed diffs are not included in the standard GitHub webhook payload
      // You would need to make additional API calls to get the actual diff content
      
      commitLog += '\n';
    }
    
    // Save to file
    await appendToCommitLog(commitLog);
    
    // Sync to Google Docs if enabled
    await syncToGoogleDocs(commitLog);
    
    console.log('Commit details logged successfully');
    
  } catch (error) {
    console.error('Error handling push event:', error);
    throw error;
  }
}

/**
 * Append commit information to the log file
 */
async function appendToCommitLog(content) {
  try {
    // Check if logs directory exists, create if not
    try {
      await fs.access(LOGS_DIR);
    } catch (err) {
      await fs.mkdir(LOGS_DIR, { recursive: true });
    }
    
    // Append to log file
    await fs.appendFile(COMMITS_LOG_FILE, content, 'utf8');
    console.log(`Commit information saved to ${COMMITS_LOG_FILE}`);
    
  } catch (error) {
    console.error('Error saving commit log:', error);
    throw error;
  }
}

/**
 * Sync commit logs to Google Docs
 */
async function syncToGoogleDocs(content) {
  try {
    // Check if Google Docs integration is enabled
    if (!process.env.GOOGLE_DOCS_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Google Docs integration not configured. Skipping sync.');
      return;
    }
    
    // Attempt to sync to Google Docs
    const success = await googleDocsSync.appendToDocument(content);
    
    if (success) {
      console.log('Successfully synced commit information to Google Docs');
    } else {
      console.warn('Failed to sync to Google Docs, but operation continued');
    }
  } catch (error) {
    console.error('Error syncing to Google Docs:', error);
    // Don't throw error to prevent webhook processing failure
    // Just log the error and continue
  }
}

/**
 * Verify GitHub webhook signature
 * @param {Object} payload - The webhook payload
 * @param {string} signature - The signature from X-Hub-Signature-256 header
 * @returns {boolean} - Whether the signature is valid
 */
function verifyGithubWebhook(payload, signature) {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}
