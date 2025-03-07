# CowSalt Pro - ERP & POS System for Cow Salt Production

CowSalt Pro is a comprehensive Enterprise Resource Planning (ERP) and Point of Sale (POS) system specifically designed for companies in the cow salt production and distribution industry. This application streamlines operations, inventory management, and sales processes to maximize efficiency and profitability.

## Industry Overview

Cow salt (mineral salt licks) is a vital nutritional supplement for livestock that provides essential minerals and prevents deficiencies. CowSalt Pro helps manufacturers and distributors manage the entire process from production tracking to final sales and distribution.

## Core Features

### Business Management
- **Dashboard Analytics**: Real-time metrics showing production volume, sales performance, inventory levels, and financial status
- **Multi-store Support**: Manage multiple production facilities and sales locations from a single interface
- **User Role Management**: Customizable access controls for administrators, managers, production staff, and sales personnel

### Production & Inventory
- **Raw Material Tracking**: Monitor salt and mineral component inventory levels
- **Production Batch Management**: Track production batches with formula compliance
- **Quality Control**: Record and manage quality testing results
- **Stock Alerts**: Automatic notifications for low inventory of raw materials and finished products
- **Reorder Level Management**: Set and monitor minimum stock levels for automatic reordering

### Sales & Distribution
- **Enhanced Point of Sale System**: Comprehensive sales processing with:
  - Interactive product grid with category filtering and search
  - Barcode scanning support for quick product lookup
  - Customer management with on-the-fly registration
  - Cart management with quantity adjustment and discounts
  - Multiple payment methods (Cash, M-Pesa, Card, Bank Transfer)
  - Receipt generation and printing options
  - Sales hold functionality for managing multiple transactions
- **Wholesale Order Management**: Handle large orders with custom pricing
- **Customer Records**: Maintain detailed customer information, purchase history, and preferences
- **Sales Analytics**: Track top-selling products, sales by location, and seasonal trends

### Financial Management
- **Cash Book**: Daily cash transaction recording and reconciliation
- **Store Ledger**: Track financial transactions by store location
- **Payments Tracking**: Monitor customer payments, outstanding balances, and payment history
- **Financial Reports**: Generate profit & loss statements, balance sheets, and cash flow reports
- **Export Capabilities**: Export financial data for use with external accounting systems

### User Management System
- **Enhanced Role-Based Access Control**: Granular permission system with role-based and user-specific permissions
- **Secure Authentication**: Password hashing and security measures
- **User Administration**: Easy user creation, editing, deletion, and password management
- **Password Management**: Password strength indicators and random password generation
- **User Activity Tracking**: Monitor user logins and system usage
- **Permission Management**: Organize permissions by functional categories for easier management

## Technical Specifications

### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Python Version**: 3.8 or higher
- **Required Libraries**: PyQt6, matplotlib, numpy, pandas, SQLAlchemy, bcrypt, and more (see requirements.txt)
- **Storage**: Minimum 500MB free disk space
- **RAM**: 4GB minimum, 8GB recommended

### Database
- SQLite database for seamless standalone operation
- Structured data management for all business operations
- Regular automatic backups to prevent data loss

## Setup and Installation

### Windows Quick Setup
1. Download and extract the application
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

## Default Authentication
- **Username**: `admin`
- **Password**: `admin`
- **Important**: Change the default credentials after first login

## Project Structure
- `main_pyqt.py` - Main application entry point
- `ui/` - UI components and views
  - `views/` - Application screens (Dashboard, Inventory, POS, etc.)
  - `widgets/` - Reusable UI components
  - `models/` - Data models and business logic
  - `utils/` - Utility functions and helpers
  - `charts/` - Data visualization components
  - `dialogs/` - Modal dialogs and popup interfaces
- `data/` - Database and data files
- `Resources/` - Application resources (icons, images, etc.)

## Development Status
This project is under active development with regular updates. See PROJECT_MILESTONES.md for the detailed development roadmap and progress updates.

## License
Copyright © 2024 CowSalt
All rights reserved. 