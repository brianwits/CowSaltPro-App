# CowSaltPro PyQt6 Implementation

This document provides detailed information about the PyQt6 implementation of CowSaltPro, including development guidelines, code organization, and how to extend the application.

## Code Organization

The application follows a modular structure:

```
CowSaltPro/
├── ui/                # UI components
│   ├── views/         # Main application views
│   ├── widgets/       # Reusable widgets
│   ├── models/        # Data models
│   └── utils/         # Utility functions
├── data/              # Application data storage
├── logs/              # Application logs
├── Resources/         # Images and resources
├── main_pyqt.py       # Application entry point
└── pyproject.toml     # Project dependencies
```

### Key Components

1. **DataManager** (`ui/models/data_manager.py`): Handles all database operations using SQLite.
2. **Views** (`ui/views/`): Each tab in the application has its own view class.
3. **Theme Manager** (`ui/utils/theme.py`): Manages application theming (light/dark).
4. **Logger** (`ui/utils/logger.py`): Handles application logging.

## Development Guidelines

### Adding a New View

1. Create a new file in `ui/views/` for your view class.
2. Extend the `QWidget` class for your view.
3. Use the following template:

```python
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from ui.models.data_manager import DataManager
from ui.utils.logger import get_logger

class NewView(QWidget):
    """Description of the new view"""
    def __init__(self):
        super().__init__()
        self.data_manager = DataManager()
        self.logger = get_logger()
        self.init_ui()
        
    def init_ui(self):
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        
        # Header
        header_label = QLabel("New View")
        header_label.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        main_layout.addWidget(header_label)
        
        # Add your UI components here
        
        # Connect signals and load data
        self.load_data()
        
    def load_data(self):
        """Load data for the view"""
        self.logger.debug("Loading data for new view")
        # Load your data here
```

4. Import and add your view to `main_pyqt.py`.

### Adding a New Database Table

1. Extend the `init_database` method in `DataManager`:

```python
def init_database(self):
    # ... existing code ...
    
    # Create new table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field1 TEXT NOT NULL,
        field2 INTEGER NOT NULL
    )
    ''')
```

2. Add getter and setter methods:

```python
def get_new_table_data(self):
    """Get data from new table"""
    self.logger.debug("Fetching new table data")
    conn = None
    try:
        conn = self._get_connection()
        df = pd.read_sql_query("SELECT * FROM new_table", conn)
        return df
    except Exception as e:
        self.logger.error(f"Error fetching new table data: {str(e)}", exc_info=True)
        return pd.DataFrame()

def add_new_table_record(self, field1, field2):
    """Add record to new table"""
    self.logger.info(f"Adding new record: {field1}")
    conn = None
    try:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO new_table (field1, field2) VALUES (?, ?)",
            (field1, field2)
        )
        conn.commit()
        self.data_changed.emit("new_table")
    except Exception as e:
        self.logger.error(f"Error adding record: {str(e)}", exc_info=True)
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()
```

### Styling Guidelines

The application uses PyQt's built-in styling capabilities. Here are guidelines for consistent styling:

1. **Fonts**:
   - Headers: Arial, 16pt, Bold
   - Section headers: Arial, 12pt, Bold
   - Regular text: Default font

2. **Colors**:
   - Income/Positive: `#27ae60` (green)
   - Expense/Negative: `#e74c3c` (red)
   - Primary accent: `#3498db` (blue)

3. **Layout Spacing**:
   - Main layout margins: 20px
   - Spacing between elements: 20px

4. **Component Styling Example**:

```python
# QFrame styling
frame.setStyleSheet("""
    QFrame {
        background-color: #f5f5f5;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
    }
""")

# Button styling
button.setStyleSheet("""
    QPushButton {
        background-color: #3498db;
        color: white;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: bold;
    }
    QPushButton:hover {
        background-color: #2980b9;
    }
    QPushButton:pressed {
        background-color: #1c6ea4;
    }
""")
```

## Error Handling

The application uses a centralized logging system. Follow these guidelines for error handling:

```python
from ui.utils.logger import get_logger

logger = get_logger()

try:
    # Potentially risky operation
    result = some_function()
except Exception as e:
    logger.error(f"Error: {str(e)}", exc_info=True)
    # Handle the error appropriately
    QMessageBox.critical(self, "Error", f"An error occurred: {str(e)}")
```

## Theming

The application supports both light and dark themes. To ensure your components work well with both:

1. Avoid hard-coding colors in your UI components.
2. Use palette colors where possible:

```python
painter = QPainter(self)
painter.setPen(self.palette().windowText().color())
painter.drawText(rect, text)
```

3. If you need to use custom colors, make them theme-aware:

```python
# Get the current theme
theme_manager = get_theme_manager()
if theme_manager.current_theme == "dark":
    color = QColor(200, 200, 200)  # Light color for dark theme
else:
    color = QColor(50, 50, 50)     # Dark color for light theme
```

## Testing

To run tests:

```bash
python -m unittest discover tests
```

When adding new features, include appropriate tests in the `tests/` directory.

## Building for Distribution

To create a standalone executable:

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed --icon=Resources/icon.ico main_pyqt.py
```

For Windows-specific distribution:

```bash
pyinstaller --onefile --windowed --icon=Resources/icon.ico --name=CowSaltPro --version-file=version_info.txt main_pyqt.py
```

## Troubleshooting

Common issues and solutions:

1. **Missing dependencies**: Ensure all required packages are installed: `pip install -e .`
2. **Database errors**: Check file permissions for the data directory
3. **UI rendering issues**: Make sure you're using Qt6Agg backend for matplotlib

Check the application logs (in the `logs/` directory) for detailed error information. 