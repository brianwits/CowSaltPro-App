/**
 * check-deps.js
 * 
 * This script checks for required dependencies and installs any missing ones.
 * It's designed to run after npm install to ensure all dependencies are correctly set up.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking for required dependencies...');

// Required dependencies that might not be installed correctly via package.json
const requiredDeps = [
  { name: 'framer-motion', dev: false },
  { name: 'pg-hstore', dev: false },
  { name: 'react-error-boundary', dev: false },
  { name: 'cross-env', dev: true }
];

// Check if we need to install any dependencies
let needToInstall = false;
const depsToInstall = [];
const devDepsToInstall = [];

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  // Check each required dependency
  for (const dep of requiredDeps) {
    const depList = dep.dev ? packageJson.devDependencies : packageJson.dependencies;
    
    if (!depList || !depList[dep.name]) {
      console.log(`Missing ${dep.dev ? 'dev ' : ''}dependency: ${dep.name}`);
      needToInstall = true;
      if (dep.dev) {
        devDepsToInstall.push(dep.name);
      } else {
        depsToInstall.push(dep.name);
      }
    }
  }
  
  // Install missing dependencies
  if (needToInstall) {
    console.log('Installing missing dependencies...');
    
    if (depsToInstall.length > 0) {
      console.log(`Installing dependencies: ${depsToInstall.join(', ')}`);
      execSync(`npm install ${depsToInstall.join(' ')}`, { stdio: 'inherit' });
    }
    
    if (devDepsToInstall.length > 0) {
      console.log(`Installing dev dependencies: ${devDepsToInstall.join(', ')}`);
      execSync(`npm install -D ${devDepsToInstall.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('Dependencies installed successfully!');
  } else {
    console.log('All required dependencies are already installed.');
  }
  
  // Check if webpack dev server is working properly
  try {
    console.log('Checking for webpack-dev-server compatibility...');
    
    // This will check the webpack version and ensure it's compatible with our setup
    const webpackVersion = execSync('npx webpack --version', { encoding: 'utf8' }).trim();
    console.log(`Webpack version: ${webpackVersion}`);
    
    // Check for potential issues
    if (webpackVersion.startsWith('5')) {
      const devServerVersion = execSync('npm list webpack-dev-server --json', { encoding: 'utf8' });
      const devServerInfo = JSON.parse(devServerVersion);
      
      // Extract webpack-dev-server version from the dependency tree
      let wdsVersion;
      try {
        wdsVersion = devServerInfo.dependencies['webpack-dev-server'].version;
      } catch (e) {
        wdsVersion = 'unknown';
      }
      
      console.log(`webpack-dev-server version: ${wdsVersion}`);
      
      if (wdsVersion !== 'unknown' && !wdsVersion.startsWith('5')) {
        console.warn('WARNING: You are using webpack 5 with an older version of webpack-dev-server.');
        console.warn('This may cause issues with the development server.');
        console.warn('Consider upgrading webpack-dev-server:');
        console.warn('   npm install webpack-dev-server@latest --save-dev');
      }
    }
  } catch (e) {
    console.error('Error checking webpack configuration:', e.message);
  }
  
} catch (error) {
  console.error('Error checking dependencies:', error.message);
  process.exit(1);
}

console.log('Dependency check completed successfully!'); 