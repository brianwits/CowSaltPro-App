# CowSaltPro

CowSaltPro is an Electron-based desktop application for managing salt distribution business operations.

## Features

- 🛍️ Point of Sale (POS) System
- 📦 Inventory Management
- 👥 Customer Management
- 📊 Sales Analytics and Reporting
- 💰 Payment Processing
- 📱 Responsive UI with modern design
- 📈 Interactive Charts and Visualizations
- 🔐 Secure Data Storage

## Current Tech Stack

This application has been updated to use:

- Electron
- React 18
- TypeScript
- Material UI
- SQLite with Sequelize
- Webpack 5
- Vitest for testing

## Getting Started

### Prerequisites

- Node.js 16+ and npm 7+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/CowSaltPro.git
   cd CowSaltPro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To run the application in development mode:

```bash
# Run the complete app in development mode
npm run dev

# Or run the renderer and main processes separately
npm run dev:renderer  # Terminal 1
npm run dev:main      # Terminal 2 (after dev server is running)
```

### Building for Production

To build the application for production:

```bash
# Build the application
npm run build:prod

# Package the application
npm run dist        # For your current platform
npm run dist:win    # For Windows
npm run dist:mac    # For macOS
```

### Testing

To run the test suite:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Headers Already Sent Error

If you encounter "Can't set headers after they are sent" errors while running in development mode, try these steps:

1. Kill any existing Node.js processes:
   ```bash
   # On Windows
   taskkill /f /im node.exe
   
   # On macOS/Linux
   pkill -f node
   ```

2. Clear the webpack cache:
   ```bash
   rm -rf node_modules/.cache
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

### Application Won't Start

If the application doesn't start:

1. Check that all dependencies are installed:
   ```bash
   npm run postinstall
   ```

2. Make sure port 3000 is available (development mode only):
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   
   # On macOS/Linux
   lsof -i :3000
   ```

3. Check the logs in the `/logs` directory for error messages.

## Project Structure

```
CowSaltPro/
├── src/                    # Source code
│   ├── main/              # Electron main process
│   ├── renderer/          # React UI (renderer process)
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── hooks/         # Custom React hooks
│   ├── preload/           # Preload scripts
│   ├── services/          # Business logic services
│   ├── database/          # Database models and configuration
│   └── utils/             # Utility functions
├── dist/                   # Built application files
├── release/                # Packaged application
├── scripts/                # Build scripts
└── tests/                  # Test files
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 