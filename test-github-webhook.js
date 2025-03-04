#!/usr/bin/env node

/**
 * Test script for the GitHub webhook
 * This script simulates a GitHub push webhook event
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default config
const config = {
  webhookUrl: 'http://localhost:3000/webhook/github',
  secretKey: process.env.GITHUB_WEBHOOK_SECRET || 'test-secret',
};

// Generate a sample payload for a GitHub push event
function generateSamplePushPayload(committerName, committerEmail, commitMessage) {
  const now = new Date().toISOString();
  const commitId = crypto.randomBytes(20).toString('hex');
  const previousCommit = crypto.randomBytes(20).toString('hex');
  
  return {
    ref: 'refs/heads/main',
    before: previousCommit,
    after: commitId,
    repository: {
      id: 123456789,
      name: 'example-repo',
      full_name: 'user/example-repo',
      private: false,
      owner: {
        name: 'user',
        email: 'user@example.com'
      },
      html_url: 'https://github.com/user/example-repo',
      description: 'Example repository for testing',
      created_at: now,
      updated_at: now,
      pushed_at: now
    },
    pusher: {
      name: committerName,
      email: committerEmail
    },
    commits: [
      {
        id: commitId,
        message: commitMessage,
        timestamp: now,
        url: `https://github.com/user/example-repo/commit/${commitId}`,
        author: {
          name: committerName,
          email: committerEmail
        },
        committer: {
          name: committerName,
          email: committerEmail
        },
        added: ['new-file.txt'],
        removed: [],
        modified: ['modified-file.txt']
      }
    ]
  };
}

// Generate the GitHub signature
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  return 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
}

// Send a simulated GitHub webhook
async function sendGitHubWebhook(payload) {
  try {
    console.log('\nPreparing to send GitHub webhook...');
    
    // Generate signature
    const signature = generateSignature(payload, config.secretKey);
    
    console.log(`\nSending GitHub push event to ${config.webhookUrl}`);
    console.log(`Commit: ${payload.commits[0].message}`);
    console.log(`Committer: ${payload.pusher.name} <${payload.pusher.email}>`);
    
    // Send the request with GitHub headers
    const response = await axios.post(config.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'push',
        'X-Hub-Signature-256': signature,
        'X-GitHub-Delivery': crypto.randomBytes(16).toString('hex')
      }
    });
    
    console.log('\n========== RESPONSE ==========');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    console.log('==============================\n');
    
    return response.data;
  } catch (error) {
    console.error('\n⚠️ Error sending GitHub webhook:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// Main function
async function main() {
  console.log('========================================');
  console.log('🤖 GitHub Webhook Test Client');
  console.log('========================================');
  
  rl.question('\nEnter your name: ', (name) => {
    const committerName = name.trim() || 'Test User';
    
    rl.question('Enter your email: ', (email) => {
      const committerEmail = email.trim() || 'test@example.com';
      
      rl.question('Enter commit message: ', async (message) => {
        const commitMessage = message.trim() || 'Test commit';
        
        // Generate payload
        const payload = generateSamplePushPayload(committerName, committerEmail, commitMessage);
        
        // Send webhook
        await sendGitHubWebhook(payload);
        
        rl.question('\nDo you want to send another webhook? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            main();
          } else {
            console.log('\nThank you for using the GitHub webhook test client!');
            rl.close();
          }
        });
      });
    });
  });
}

// Install axios if not already installed
const { execSync } = require('child_process');
try {
  require.resolve('axios');
  // Axios is installed, proceed with main function
  main();
} catch (e) {
  console.log('Installing axios dependency...');
  try {
    execSync('npm install axios --no-save', { stdio: 'inherit' });
    console.log('Axios installed successfully!');
    main();
  } catch (error) {
    console.error('Failed to install axios. Please run: npm install axios');
    process.exit(1);
  }
}
