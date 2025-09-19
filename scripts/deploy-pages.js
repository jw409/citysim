#!/usr/bin/env node

/**
 * Deploy to GitHub Pages
 *
 * This script deploys the built static files to the gh-pages branch
 * without affecting the main development branch.
 *
 * Usage: npm run deploy
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const BRANCH = 'gh-pages';

function run(command, options = {}) {
  console.log(`> ${command}`);
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function runQuiet(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function main() {
  console.log('🚀 Deploying to GitHub Pages...\n');

  // Check if dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error(`❌ ${DIST_DIR} directory not found. Run 'npm run build' first.`);
    process.exit(1);
  }

  // Get current branch and check if working tree is clean
  const currentBranch = runQuiet('git branch --show-current');
  const hasChanges = runQuiet('git status --porcelain');

  if (hasChanges) {
    console.error('❌ Working tree has uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  console.log(`📍 Current branch: ${currentBranch}`);
  console.log(`📦 Deploying from: ${DIST_DIR}/`);
  console.log(`🎯 Target branch: ${BRANCH}\n`);

  // Check if gh-pages branch exists
  const branchExists = runQuiet(`git show-ref --verify --quiet refs/heads/${BRANCH}`);

  if (!branchExists) {
    console.log(`🔄 Creating ${BRANCH} branch...`);
    run(`git checkout --orphan ${BRANCH}`);
    run('git rm -rf .');
  } else {
    console.log(`🔄 Switching to ${BRANCH} branch...`);
    run(`git checkout ${BRANCH}`);
  }

  // Copy dist files to root
  console.log('📋 Copying build files...');
  run(`cp -r ${DIST_DIR}/* .`);

  // Ensure .nojekyll exists to disable Jekyll
  run('touch .nojekyll');

  // Stage all changes
  run('git add -A');

  // Check if there are changes to commit
  const hasChangesToCommit = runQuiet('git diff --cached --exit-code');

  if (hasChangesToCommit === null) {
    // git diff returns non-zero when there are changes, which means there are changes to commit
    const timestamp = new Date().toISOString();
    run(`git commit -m "Deploy to GitHub Pages - ${timestamp}"`);

    console.log('📤 Pushing to remote...');
    run(`git push origin ${BRANCH}`);

    console.log('\n✅ Successfully deployed to GitHub Pages!');
    console.log('🌐 Your demo will be available at: https://jw409.github.io/citysim/');
    console.log('⏱️  GitHub Pages may take a few minutes to update.');
  } else {
    console.log('ℹ️  No changes to deploy.');
  }

  // Switch back to original branch
  console.log(`\n🔄 Switching back to ${currentBranch}...`);
  run(`git checkout ${currentBranch}`);

  console.log('\n🎉 Deployment complete!');
}

main();