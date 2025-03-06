# CowSalt Pro

<div align="center">

![CowSalt Pro Logo](Resources/icons/app_icon.png)

A comprehensive ERP & POS System for Professional Salt Distribution Management

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![PyQt6](https://img.shields.io/badge/PyQt-6.5.0+-green.svg)](https://www.riverbankcomputing.com/software/pyqt/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

</div>

## 📋 Project Structure

```plaintext
CowSaltPro/
├── src/                    # Source code
│   ├── core/              # Core business logic
│   │   ├── config.py      # Configuration management
│   │   ├── constants.py   # Global constants
│   │   └── types.py       # Type definitions
│   ├── ui/                # User interface
│   │   ├── views/         # Application screens
│   │   ├── widgets/       # Reusable components
│   │   └── utils/         # UI utilities
│   ├── models/            # Data models
│   ├── database/          # Database operations
│   ├── services/          # Business services
│   └── tests/             # Test suite
├── docs/                  # Documentation
│   ├── guides/           # User and developer guides
│   └── api/              # API documentation
├── scripts/              # Utility scripts
│   ├── deployment/       # Deployment scripts
│   └── development/      # Development tools
├── config/              # Configuration files
├── data/               # Application data
├── logs/               # Log files
└── Resources/          # Static resources
    ├── icons/         # Application icons
    ├── images/        # Images and graphics
    └── themes/        # UI themes
```

## 🌟 Features

- **Modern UI/UX**
  - Responsive design with light/dark theme support
  - Intuitive navigation and workflows
  - Custom-designed widgets and components

- **Core Business Functions**
  - 📊 Interactive Dashboard with real-time metrics
  - 🏪 Point of Sale (POS) system
  - 📦 Inventory Management
  - 📒 Stores Ledger
  - 💰 Cash Book
  - 💳 Payments Tracking

- **Advanced Capabilities**
  - 📈 Reports and Analytics
  - 👥 User Management with role-based access
  - ⚙️ Customizable Settings
  - 🔒 Secure Authentication System

## 🚀 Quick Start

### Windows Users

1. Double-click `scripts/deployment/run_app.bat` for automatic setup and launch
   - Creates virtual environment (if needed)
   - Installs dependencies
   - Launches application

### Manual Setup (All Platforms)

1. **Prerequisites**
   ```bash
   # Ensure Python 3.8+ is installed
   python --version
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   
   # Activate:
   # Windows
   .\\venv\\Scripts\\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -e ".[dev]"  # Install with development dependencies
   # or
   pip install .  # Install only runtime dependencies
   ```

4. **Launch Application**
   ```bash
   python -m cowsaltpro
   ```

## 🔧 Development

### Project Configuration

The project uses `pyproject.toml` for configuration:
- Build system: `setuptools`
- Dependencies management
- Development tools configuration:
  - pytest
  - black
  - isort
  - mypy
  - flake8

### Running Tests

```bash
pytest                 # Run all tests
pytest -v              # Verbose output
pytest --cov=src      # With coverage report
```

### Code Style

```bash
black src/            # Format code
isort src/            # Sort imports
mypy src/             # Type checking
flake8 src/           # Linting
```

## 📁 Configuration

Application configuration is managed through:
1. `config/config.json` - Main configuration file
2. Environment variables
3. Command line arguments

### Configuration Hierarchy

1. Command line arguments (highest priority)
2. Environment variables
3. User configuration file
4. Default values (lowest priority)

## 🔐 Default Access

- **Username**: `admin`
- **Password**: `admin`

⚠️ *Remember to change default credentials after first login*

## 📄 License

Copyright © 2024 CowSalt. All rights reserved.

## 🤝 Support

For support:
- Check the [documentation](docs/)
- Open an [issue](https://github.com/brianwits/CowSaltPro-App/issues)
- Contact our support team

---

<div align="center">
Made with ❤️ by the CowSalt Pro Team
</div>