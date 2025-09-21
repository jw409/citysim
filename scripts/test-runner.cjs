#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function runCommand(command, description) {
  log(`\n${COLORS.BLUE}${COLORS.BOLD}${description}${COLORS.RESET}`);
  log(`${COLORS.YELLOW}Running: ${command}${COLORS.RESET}`);

  try {
    execSync(command, { stdio: 'inherit' });
    log(`${COLORS.GREEN}✅ ${description} completed successfully${COLORS.RESET}`);
    return true;
  } catch (error) {
    log(`${COLORS.RED}❌ ${description} failed${COLORS.RESET}`);
    return false;
  }
}

function checkPrerequisites() {
  log(`${COLORS.BLUE}${COLORS.BOLD}Checking Prerequisites${COLORS.RESET}`);

  // Check if playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    log(`${COLORS.GREEN}✅ Playwright is installed${COLORS.RESET}`);
  } catch (error) {
    log(`${COLORS.RED}❌ Playwright is not installed. Run: npm install${COLORS.RESET}`);
    return false;
  }

  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    log(`${COLORS.GREEN}✅ Playwright browsers are installed${COLORS.RESET}`);
  } catch (error) {
    log(`${COLORS.YELLOW}⚠️  Some browsers may not be installed. Run: npx playwright install${COLORS.RESET}`);
  }

  return true;
}

function createDirectories() {
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'tests/baselines'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`${COLORS.GREEN}Created directory: ${dir}${COLORS.RESET}`);
    }
  });
}

function runTestSuite(suiteName, options = {}) {
  const {
    headed = false,
    debug = false,
    project = 'chromium',
    grep = null,
    workers = undefined,
    updateSnapshots = false
  } = options;

  let command = 'npx playwright test';

  if (suiteName && suiteName !== 'all') {
    command += ` tests/e2e/${suiteName}`;
  }

  if (headed) command += ' --headed';
  if (debug) command += ' --debug';
  if (project !== 'all') command += ` --project=${project}`;
  if (grep) command += ` --grep="${grep}"`;
  if (workers) command += ` --workers=${workers}`;
  if (updateSnapshots) command += ' --update-snapshots';

  return runCommand(command, `Running ${suiteName || 'all'} tests`);
}

function generateReport() {
  return runCommand(
    'npx playwright show-report',
    'Generating and opening test report'
  );
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  log(`${COLORS.BLUE}${COLORS.BOLD}🧪 UrbanSynth Test Runner${COLORS.RESET}\n`);

  if (!checkPrerequisites()) {
    process.exit(1);
  }

  createDirectories();

  switch (command) {
    case 'all':
      runTestSuite('all', { project: args[1] || 'chromium' });
      break;

    case 'core':
      runTestSuite('core', { project: args[1] || 'chromium' });
      break;

    case 'viewport':
      runTestSuite('viewport', { project: args[1] || 'chromium' });
      break;

    case 'simulation':
      runTestSuite('simulation', { project: args[1] || 'chromium' });
      break;

    case 'ui-panels':
      runTestSuite('ui-panels', { project: args[1] || 'chromium' });
      break;

    case 'visual':
      runTestSuite('visual-regression', {
        project: args[1] || 'chromium',
        updateSnapshots: args.includes('--update-snapshots')
      });
      break;

    case 'headed':
      runTestSuite(args[1] || 'all', {
        headed: true,
        project: args[2] || 'chromium'
      });
      break;

    case 'debug':
      runTestSuite(args[1] || 'core', {
        debug: true,
        project: 'chromium',
        workers: 1
      });
      break;

    case 'cross-browser':
      log(`${COLORS.BLUE}Running tests across all browsers${COLORS.RESET}`);
      ['chromium', 'firefox', 'webkit'].forEach(browser => {
        runTestSuite('core', { project: browser });
      });
      break;

    case 'smoke':
      runTestSuite('all', {
        grep: 'should load|should start|should initialize',
        project: 'chromium'
      });
      break;

    case 'performance':
      runTestSuite('all', {
        grep: 'performance|fps|memory|speed',
        project: 'chromium'
      });
      break;

    case 'report':
      generateReport();
      break;

    case 'install':
      runCommand('npx playwright install', 'Installing Playwright browsers');
      break;

    case 'update-snapshots':
      runTestSuite('visual-regression', {
        updateSnapshots: true,
        project: 'chromium'
      });
      break;

    case 'help':
    default:
      log(`${COLORS.BLUE}Available commands:${COLORS.RESET}

${COLORS.GREEN}Test Suites:${COLORS.RESET}
  all [browser]           - Run all tests (default: chromium)
  core [browser]          - Run core infrastructure tests
  viewport [browser]      - Run viewport and camera tests
  simulation [browser]    - Run simulation control tests
  ui-panels [browser]     - Run UI panel tests
  visual [browser]        - Run visual regression tests

${COLORS.GREEN}Special Modes:${COLORS.RESET}
  headed [suite] [browser] - Run tests in headed mode (visible browser)
  debug [suite]           - Run tests in debug mode (single worker, breakpoints)
  cross-browser           - Run core tests across all browsers
  smoke                   - Run smoke tests (quick validation)
  performance             - Run performance-related tests only

${COLORS.GREEN}Utilities:${COLORS.RESET}
  report                  - Open test report
  install                 - Install Playwright browsers
  update-snapshots        - Update visual regression baselines
  help                    - Show this help

${COLORS.GREEN}Browser options:${COLORS.RESET} chromium, firefox, webkit, all

${COLORS.GREEN}Examples:${COLORS.RESET}
  ${COLORS.YELLOW}node scripts/test-runner.js all${COLORS.RESET}
  ${COLORS.YELLOW}node scripts/test-runner.js viewport firefox${COLORS.RESET}
  ${COLORS.YELLOW}node scripts/test-runner.js headed simulation${COLORS.RESET}
  ${COLORS.YELLOW}node scripts/test-runner.js debug core${COLORS.RESET}
`);
      break;
  }
}

if (require.main === module) {
  main();
}