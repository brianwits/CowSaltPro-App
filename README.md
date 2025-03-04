# CowSaltPro - Salt Distribution Management System

A modern desktop application built with Electron, React, and TypeScript for managing salt distribution business operations.

## Features

- 🛍️ Point of Sale (POS) System
- 📦 Inventory Management
- 👥 Customer Management
- 📊 Sales Analytics and Reporting
- 💰 Payment Processing
- 🔄 Automatic Backups
- 🌙 Dark/Light Theme Support
- 🔐 Secure Settings Storage

## Tech Stack

- Electron
- React
- TypeScript
- SQLite (via Sequelize)
- Material-UI
- Electron Store
- Recharts

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/CowSaltPro.git
   cd CowSaltPro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Initialize the database:
   ```bash
   npm run init-db
   # or
   yarn init-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── database/          # Database models and initialization
├── renderer/          # React application
│   ├── components/    # Reusable components
│   ├── context/      # React context providers
│   ├── hooks/        # Custom hooks
│   └── pages/        # Application pages
├── services/         # Business logic services
└── config/          # Configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 