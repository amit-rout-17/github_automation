#!/usr/bin/env node

/**
 * Test Script to verify Git Commit Tracking
 * 
 * This script helps test the commit tracking functionality without making an actual commit.
 * It simulates the post-commit hook behavior.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Testing Git Commit Tracking System');
  console.log('---------------------------------');
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    try {
      await fs.access(logsDir);
    } catch (err) {
      console.log('Creating logs directory...');
      await fs.mkdir(logsDir, { recursive: true });
    }
    
    // Simulate a commit with sample data
    const sampleCommit = {
      id: 'sample-' + Date.now().toString(16),
      previousCommit: 'sample-previous-' + Date.now().toString(16),
      committer: {
        name: 'Test User',
        email: 'test@example.com'
      },
      message: 'Test commit from test-commit.js',
      timestamp: new Date().toISOString(),
      filesChanged: [
        { status: 'A', file: 'test-file-1.js' },
        { status: 'M', file: 'test-file-2.js' },
        { status: 'D', file: 'test-file-3.js' }
      ],
      diff: `diff --git a/test-file-1.js b/test-file-1.js
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/test-file-1.js
@@ -0,0 +1,3 @@
+// This is a test file
+console.log('Hello, world!');
+// End of test file`
    };
    
    // Format the commit log entry
    let commitLog = '';
    commitLog += '==================== COMMIT DETAILS ====================\n';
    commitLog += `Committer: ${sampleCommit.committer.name} <${sampleCommit.committer.email}>\n`;
    commitLog += `Commit ID: ${sampleCommit.id}\n`;
    commitLog += `Previous Commit: ${sampleCommit.previousCommit}\n`;
    commitLog += `Date: ${sampleCommit.timestamp}\n`;
    commitLog += `Message: ${sampleCommit.message}\n\n`;
    
    commitLog += '============ CHANGED FILES ============\n';
    for (const file of sampleCommit.filesChanged) {
      const statusSymbol = file.status === 'A' ? '+' : file.status === 'D' ? '-' : '~';
      commitLog += `${statusSymbol} ${file.file}\n`;
    }
    commitLog += '\n';
    
    commitLog += '============ DIFF OUTPUT ============\n';
    commitLog += sampleCommit.diff;
    commitLog += '\n';
    commitLog += '===========================================\n\n';
    
    // Write to the log file
    const logFile = path.join(logsDir, 'commits.log');
    console.log(`Writing test commit to ${logFile}...`);
    await fs.appendFile(logFile, commitLog, 'utf8');
    
    // Format the JSON log entry
    const jsonLogFile = path.join(logsDir, 'processed-commits.log');
    console.log(`Writing JSON data to ${jsonLogFile}...`);
    await fs.appendFile(jsonLogFile, JSON.stringify(sampleCommit, null, 2) + '\n\n', 'utf8');
    
    console.log('Test completed successfully!');
    console.log(`Check the log files in the ${logsDir} directory.`);
    
    // Optional: Try to run the process-commit.js script
    try {
      console.log('\nAttempting to run the process-commit.js script...');
      const scriptPath = path.join(__dirname, 'src', 'scripts', 'process-commit.js');
      execSync(`node ${scriptPath} ${sampleCommit.id} ${sampleCommit.previousCommit} "${sampleCommit.committer.name}" "${sampleCommit.committer.email}" "${sampleCommit.message}"`, { 
        stdio: 'inherit',
        timeout: 10000
      });
    } catch (error) {
      console.error('Error running process-commit.js:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
