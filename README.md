# CowSaltPro

A professional cattle salt management system that helps farmers track and manage salt consumption for their livestock.

## Features

- Track salt consumption per animal
- Monitor herd health metrics
- Generate detailed reports
- User-friendly interface
- Data visualization

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/brianwits/CowSaltPro-App.git
cd CowSaltPro-App
```

2. Install Python dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Application

### Development Mode

```bash
# Run the PyQt application
python main_pyqt.py

# Run the web application
npm run dev
# or
yarn dev
```

### Production Mode

```bash
# Build and run the PyQt application
pyinstaller main_pyqt.spec
./dist/main_pyqt/main_pyqt

# Build and run the web application
npm run build
npm run start
# or
yarn build
yarn start
```

## Documentation

- [Project Milestones](PROJECT_MILESTONES.md)
- [PyQt Documentation](PYQT_README.md)
- [Debugging Guide](DEBUGGING_GUIDE.md)
- [Refactoring Guide](REFACTORING.md)
- [Implementation Summary](implementation-summary.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.