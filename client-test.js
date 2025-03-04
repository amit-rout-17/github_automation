#!/usr/bin/env node

/**
 * Test client for the OpenAI webhook
 * This script sends a test request to the webhook endpoint
 */

const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default config
const config = {
  webhookUrl: 'http://localhost:3000/api/webhook',
  defaultPrompt: 'Tell me an interesting fact about technology',
  defaultModel: 'gpt-3.5-turbo'
};

/**
 * Send a request to the webhook
 */
async function sendWebhookRequest(prompt, model = config.defaultModel) {
  try {
    console.log(`\nSending request to webhook with prompt: "${prompt}"`);
    console.log(`Using model: ${model}`);
    
    const payload = {
      event: 'content_request',
      data: {
        prompt,
        model,
        temperature: 0.7,
        max_tokens: 500
      }
    };
    
    console.log('\nSending request...');
    const response = await axios.post(config.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n========== RESPONSE ==========');
    console.log('Status:', response.status);
    console.log('Generated Content:');
    console.log(response.data.data.generated_content);
    console.log('\nMetadata:');
    console.log(`Model: ${response.data.data.model_used}`);
    console.log(`Tokens Used: ${response.data.data.total_tokens}`);
    console.log('==============================\n');
    
    return response.data;
  } catch (error) {
    console.error('\n⚠️ Error sending webhook request:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Main function to run the client
 */
async function main() {
  console.log('========================================');
  console.log('🤖 OpenAI Webhook Test Client');
  console.log('========================================');
  console.log(`Webhook URL: ${config.webhookUrl}`);
  
  rl.question('\nEnter your prompt (or press Enter for default): ', async (prompt) => {
    const userPrompt = prompt.trim() || config.defaultPrompt;
    
    rl.question('Enter model (or press Enter for gpt-3.5-turbo): ', async (model) => {
      const userModel = model.trim() || config.defaultModel;
      
      await sendWebhookRequest(userPrompt, userModel);
      
      rl.question('\nDo you want to send another request? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          main();
        } else {
          console.log('\nThank you for using the OpenAI webhook test client!');
          rl.close();
        }
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
