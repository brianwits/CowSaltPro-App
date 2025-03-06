# CowSalt Pro - PyQt Implementation

This is the PyQt implementation of the CowSalt Pro ERP & POS System for Salt Distribution Management.

## Requirements

- Python 3.8 or higher
- PyQt6 and other dependencies listed in `requirements.txt`

## Setup and Installation

### Windows

1. Make sure Python 3.8+ is installed and in your PATH
2. Double-click the `run_pyqt_app.bat` file to:
   - Create a virtual environment (if not exists)
   - Install required dependencies
   - Run the application

### Manual Setup (All Platforms)

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python main_pyqt.py
   ```

## Features

- Modern, responsive UI with light/dark theme support
- Authentication system with user roles
- Dashboard with key business metrics
- Inventory management
- Point of Sale (POS) system
- Stores ledger
- Cash book
- Payments tracking
- Reports and analytics
- User management
- Settings and configuration

## Default Login

- Username: `admin`
- Password: `admin`

## Directory Structure

- `main_pyqt.py` - Main application entry point
- `ui/` - UI components and views
  - `views/` - Application views (screens)
  - `widgets/` - Reusable UI components
  - `utils/` - Utility functions and classes
- `models/` - Data models and database interaction
- `Resources/` - Application resources (icons, images, etc.)
- `data/` - Database and data files

## License

Copyright © 2024 CowSalt 