# CowSalt Pro

<div align="center">

![CowSalt Pro Logo](Resources/icons/app_icon.png)

A comprehensive ERP & POS System for Professional Salt Distribution Management

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![PyQt6](https://img.shields.io/badge/PyQt-6.5.0+-green.svg)](https://www.riverbankcomputing.com/software/pyqt/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

</div>

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

1. Double-click `run_pyqt_app.bat` for automatic setup and launch
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
   pip install -r requirements.txt
   ```

4. **Launch Application**
   ```bash
   python main_pyqt.py
   ```

## 🔧 Technical Stack

- **Frontend Framework**: PyQt6
- **Data Visualization**: Matplotlib
- **Data Processing**: NumPy, Pandas
- **Database ORM**: SQLAlchemy
- **Security**: Bcrypt
- **Reporting**: ReportLab
- **File Handling**: Pillow, OpenPyXL

## 📁 Project Structure

```
CowSaltPro/
├── main_pyqt.py          # Application entry point
├── ui/                   # User interface components
│   ├── views/           # Application screens
│   ├── widgets/         # Reusable components
│   └── utils/           # UI utilities
├── Resources/           # Assets (icons, images)
├── data/                # Database and data files
└── models/             # Data models and DB interaction
```

## 🔐 Default Access

- **Username**: `admin`
- **Password**: `admin`

⚠️ *Remember to change default credentials after first login*

## 🛠️ Development

### Requirements

```plaintext
PyQt6>=6.5.0
matplotlib>=3.7.0
numpy>=1.24.0
pandas>=2.0.0
SQLAlchemy>=2.0.0
bcrypt>=4.0.0
python-dateutil>=2.8.0
Pillow>=10.0.0
openpyxl>=3.1.0
reportlab>=4.0.0
```

### Building from Source

1. Clone the repository
   ```bash
   git clone https://github.com/brianwits/CowSaltPro-App.git
   cd CowSaltPro-App
   ```

2. Install development dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Run tests (if available)
   ```bash
   python -m pytest tests/
   ```

## 📄 License

Copyright © 2024 CowSalt. All rights reserved.

## 🤝 Support

For support, please:
- Open an issue on GitHub
- Contact our support team
- Check the documentation

---

<div align="center">
Made with ❤️ by the CowSalt Pro Team
</div>