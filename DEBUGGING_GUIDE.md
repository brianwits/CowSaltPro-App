# JavaScript Debugging Techniques Guide

This guide contains examples and explanations of common debugging techniques for JavaScript and React applications.

## Contents

The `debuggingTechniques.js` file includes:

1. **Console Logging Techniques** - Various ways to use console methods for debugging
2. **Async/Await Debugging** - Common mistakes and solutions with async code
3. **React PropType Validation** - Type checking to catch errors early
4. **Null/Undefined Safety** - Working with potentially missing data
5. **React State Management** - Avoiding common state mutation issues
6. **Browser DevTools Tips** - Using browser development tools effectively

## How to Use

### As a Reference

Import specific techniques as needed:

```javascript
const { demonstrateLogging } = require('./debuggingTechniques');

// Use the functions to see examples
demonstrateLogging();
```

### For Learning

Review the code examples and comments to understand common issues and solutions.

## Running Examples

For the browser-based examples, include the code in a web application context.

For Node.js examples:

```bash
node
> const debug = require('./debuggingTechniques');
> debug.demonstrateLogging();
```

## Common Debugging Patterns

### 1. Progressive Console Logging

When tracking down issues, use progressive logging to narrow down the problem:

```javascript
function complexFunction(data) {
  console.log('1. Function called with:', data);
  
  const processed = processData(data);
  console.log('2. Data processed:', processed);
  
  const result = calculateResult(processed);
  console.log('3. Result calculated:', result);
  
  return result;
}
```

### 2. Try/Catch Blocks for Debugging

Wrap suspicious code in try/catch to identify errors without breaking execution:

```javascript
try {
  const result = riskyOperation();
  // Continue processing
} catch (error) {
  console.error('Error in riskyOperation:', error);
  // Provide fallback or default value
  const result = defaultValue;
}
```

### 3. Conditional Breakpoints

In browser DevTools, set conditional breakpoints to pause only when certain conditions are met:

```javascript
function processItems(items) {
  items.forEach((item, index) => {
    // In DevTools, set a conditional breakpoint on the next line:
    // condition: item.id === 'problematic-id'
    processItem(item);
  });
}
```

## Additional Debugging Resources

- [Chrome DevTools Documentation](https://developers.google.com/web/tools/chrome-devtools)
- [React Developer Tools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
- [JavaScript Debugging in VS Code](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/) 