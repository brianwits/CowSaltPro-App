import os
import enum
import json
from pathlib import Path
from PyQt6.QtGui import QPalette, QColor, QFont
from PyQt6.QtCore import QObject, pyqtSignal, QSettings
from PyQt6.QtWidgets import QApplication

from ui.utils.logger import get_logger

class ThemeType(enum.Enum):
    """Theme type enumeration"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"  # Follow system preference


class ThemeManager(QObject):
    """
    Manager for application theming with support for light and dark modes.
    Also provides modern styling for PyQt widgets.
    """
    # Signal emitted when theme changes
    theme_changed = pyqtSignal(ThemeType)
    
    # Define color palettes
    PALETTES = {
        ThemeType.LIGHT: {
            'primary': '#1976D2',         # Primary blue
            'secondary': '#26A69A',       # Teal color
            'success': '#2E7D32',         # Green
            'warning': '#FF9800',         # Orange
            'error': '#D32F2F',           # Red
            'info': '#0288D1',            # Light blue
            'background': '#FFFFFF',      # White background
            'surface': '#F5F5F5',         # Light grey surface
            'border': '#E0E0E0',          # Light grey border
            'text': {
                'primary': '#212121',     # Very dark grey, almost black
                'secondary': '#757575',   # Medium grey
                'disabled': '#9E9E9E',    # Lighter grey
                'hint': '#9E9E9E',        # Same as disabled
            }
        },
        ThemeType.DARK: {
            'primary': '#2196F3',         # Slightly lighter blue for dark theme
            'secondary': '#4DB6AC',       # Slightly lighter teal for dark theme
            'success': '#4CAF50',         # Green
            'warning': '#FFC107',         # Amber
            'error': '#F44336',           # Red
            'info': '#29B6F6',            # Light blue
            'background': '#121212',      # Very dark grey background
            'surface': '#1E1E1E',         # Dark grey surface
            'border': '#333333',          # Dark grey border
            'text': {
                'primary': '#FFFFFF',     # White
                'secondary': '#B0B0B0',   # Light grey
                'disabled': '#737373',    # Medium grey
                'hint': '#737373',        # Same as disabled
            }
        }
    }
    
    def __init__(self):
        super().__init__()
        self.logger = get_logger()
        self.settings = QSettings()
        
        # Load current theme from settings or use system default
        theme_str = self.settings.value("appearance/theme", ThemeType.LIGHT.value)
        
        if isinstance(theme_str, str) and theme_str in [t.value for t in ThemeType]:
            self.current_theme = ThemeType(theme_str)
        else:
            self.current_theme = ThemeType.LIGHT
            
        # Load custom theme overrides if they exist
        self.load_custom_theme_overrides()
    
    def load_custom_theme_overrides(self):
        """Load custom theme overrides from theme.json if it exists"""
        themes_path = Path("Resources/themes")
        
        if not themes_path.exists():
            # Create themes directory if it doesn't exist
            os.makedirs(themes_path, exist_ok=True)
        
        # Check for custom theme overrides
        theme_file = themes_path / "theme.json"
        if theme_file.exists():
            try:
                with open(theme_file, 'r') as f:
                    custom_themes = json.load(f)
                    
                # Update default palettes with custom values
                if 'light' in custom_themes:
                    self._update_palette(ThemeType.LIGHT, custom_themes['light'])
                
                if 'dark' in custom_themes:
                    self._update_palette(ThemeType.DARK, custom_themes['dark'])
            except Exception as e:
                print(f"Error loading custom theme: {e}")
    
    def _update_palette(self, theme_type, custom_values):
        """Update palette with custom values, preserving the structure"""
        palette = self.PALETTES[theme_type]
        
        # Update root level values
        for key, value in custom_values.items():
            if key in palette and key != 'text':
                palette[key] = value
        
        # Update nested text values
        if 'text' in custom_values and isinstance(custom_values['text'], dict):
            for text_key, text_value in custom_values['text'].items():
                if text_key in palette['text']:
                    palette['text'][text_key] = text_value
    
    def apply_theme(self, app):
        """Apply the current theme to the application"""
        if self.current_theme == ThemeType.DARK:
            self._apply_dark_theme(app)
        else:
            self._apply_light_theme(app)
        
        # Apply common font settings
        self._apply_fonts(app)
        
        # Emit theme changed signal
        self.theme_changed.emit(self.current_theme)
        
        return self.current_theme.value
    
    def toggle_theme(self, app):
        """Toggle between light and dark theme"""
        # Toggle theme
        if self.current_theme == ThemeType.LIGHT:
            self.current_theme = ThemeType.DARK
        else:
            self.current_theme = ThemeType.LIGHT
        
        # Save in settings
        self.settings.setValue("appearance/theme", self.current_theme.value)
        
        # Apply the new theme
        return self.apply_theme(app)
    
    def _apply_dark_theme(self, app):
        """Apply dark theme to the application"""
        palette = QPalette()
        colors = self.PALETTES[ThemeType.DARK]
        
        # Set basic colors
        palette.setColor(QPalette.ColorRole.Window, QColor(colors['background']))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Base, QColor(colors['surface']))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(colors['surface']).darker(110))
        palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(colors['surface']))
        palette.setColor(QPalette.ColorRole.ToolTipText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Text, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Button, QColor(colors['surface']))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.BrightText, QColor('#FFFFFF'))
        palette.setColor(QPalette.ColorRole.Link, QColor(colors['primary']))
        palette.setColor(QPalette.ColorRole.Highlight, QColor(colors['primary']))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor('#FFFFFF'))
        
        # Set disabled colors
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.Text, QColor(colors['text']['disabled']))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.ButtonText, QColor(colors['text']['disabled']))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.Highlight, QColor(colors['surface']).lighter(120))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.HighlightedText, QColor(colors['text']['disabled']))
        
        # Apply palette
        app.setPalette(palette)
        
        # Set stylesheet for additional styling
        app.setStyleSheet(f"""
            QToolTip {{ 
                background-color: {colors['surface']}; 
                color: {colors['text']['primary']}; 
                border: 1px solid {colors['border']}; 
                padding: 5px;
                border-radius: 4px;
            }}
            
            QScrollBar:vertical {{
                background: {colors['surface']};
                width: 12px;
                margin: 0px;
                border-radius: 6px;
            }}
            
            QScrollBar::handle:vertical {{
                background: {colors['border']};
                min-height: 20px;
                border-radius: 6px;
            }}
            
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
            
            QScrollBar:horizontal {{
                background: {colors['surface']};
                height: 12px;
                margin: 0px;
                border-radius: 6px;
            }}
            
            QScrollBar::handle:horizontal {{
                background: {colors['border']};
                min-width: 20px;
                border-radius: 6px;
            }}
            
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
                width: 0px;
            }}
            
            QTableView, QListView, QTreeView {{
                border: 1px solid {colors['border']};
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
                gridline-color: {colors['border']};
                selection-background-color: {colors['primary']};
                selection-color: white;
                alternate-background-color: {QColor(colors['surface']).darker(110).name()};
            }}
            
            QHeaderView::section {{
                background-color: {colors['surface']};
                padding: 4px;
                color: {colors['text']['primary']};
                border: 1px solid {colors['border']};
            }}
            
            QPushButton {{
                background-color: {colors['primary']};
                color: white;
                border: none;
                padding: 6px 16px;
                border-radius: 4px;
            }}
            
            QPushButton:hover {{
                background-color: {QColor(colors['primary']).lighter(110).name()};
            }}
            
            QPushButton:pressed {{
                background-color: {QColor(colors['primary']).darker(110).name()};
            }}
            
            QPushButton:disabled {{
                background-color: {colors['border']};
                color: {colors['text']['disabled']};
            }}
            
            QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox, QDateEdit, QComboBox {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                padding: 4px;
                border-radius: 4px;
                color: {colors['text']['primary']};
            }}
            
            QTabWidget::tab-bar {{
                left: 0px;
            }}
            
            QTabBar::tab {{
                background: {colors['surface']};
                color: {colors['text']['primary']};
                padding: 8px 12px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                border: 1px solid {colors['border']};
                margin-right: 2px;
            }}
            
            QTabBar::tab:selected {{
                background: {colors['background']};
                border-bottom-color: {colors['background']};
            }}
            
            QTabBar::tab:!selected {{
                margin-top: 2px;
            }}
            
            QMenuBar {{
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
            }}
            
            QMenuBar::item {{
                background: transparent;
                padding: 4px 10px;
            }}
            
            QMenuBar::item:selected {{
                background: {colors['primary']};
                color: white;
                border-radius: 4px;
            }}
            
            QMenu {{
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
                border: 1px solid {colors['border']};
                border-radius: 4px;
            }}
            
            QMenu::item {{
                padding: 6px 25px 6px 25px;
                border-radius: 4px;
            }}
            
            QMenu::item:selected {{
                background-color: {colors['primary']};
                color: white;
            }}
            
            QStatusBar {{
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
                border-top: 1px solid {colors['border']};
            }}
        """)
    
    def _apply_light_theme(self, app):
        """Apply light theme to the application"""
        palette = QPalette()
        colors = self.PALETTES[ThemeType.LIGHT]
        
        # Set basic colors
        palette.setColor(QPalette.ColorRole.Window, QColor(colors['background']))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Base, QColor(colors['background']))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(colors['surface']))
        palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(colors['background']))
        palette.setColor(QPalette.ColorRole.ToolTipText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Text, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.Button, QColor(colors['surface']))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(colors['text']['primary']))
        palette.setColor(QPalette.ColorRole.BrightText, QColor('#000000'))
        palette.setColor(QPalette.ColorRole.Link, QColor(colors['primary']))
        palette.setColor(QPalette.ColorRole.Highlight, QColor(colors['primary']))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor('#FFFFFF'))
        
        # Set disabled colors
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.Text, QColor(colors['text']['disabled']))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.ButtonText, QColor(colors['text']['disabled']))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.Highlight, QColor('#DDDDDD'))
        palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.HighlightedText, QColor('#FFFFFF'))
        
        # Apply palette
        app.setPalette(palette)
        
        # Set stylesheet for additional styling
        app.setStyleSheet(f"""
            QToolTip {{ 
                background-color: {colors['background']}; 
                color: {colors['text']['primary']}; 
                border: 1px solid {colors['border']}; 
                padding: 5px;
                border-radius: 4px;
            }}
            
            QScrollBar:vertical {{
                background: {colors['background']};
                width: 12px;
                margin: 0px;
                border-radius: 6px;
            }}
            
            QScrollBar::handle:vertical {{
                background: {colors['border']};
                min-height: 20px;
                border-radius: 6px;
            }}
            
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0px;
            }}
            
            QScrollBar:horizontal {{
                background: {colors['background']};
                height: 12px;
                margin: 0px;
                border-radius: 6px;
            }}
            
            QScrollBar::handle:horizontal {{
                background: {colors['border']};
                min-width: 20px;
                border-radius: 6px;
            }}
            
            QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{
                width: 0px;
            }}
            
            QTableView, QListView, QTreeView {{
                border: 1px solid {colors['border']};
                background-color: {colors['background']};
                color: {colors['text']['primary']};
                gridline-color: {colors['border']};
                selection-background-color: {colors['primary']};
                selection-color: white;
                alternate-background-color: {colors['surface']};
            }}
            
            QHeaderView::section {{
                background-color: {colors['surface']};
                padding: 4px;
                color: {colors['text']['primary']};
                border: 1px solid {colors['border']};
            }}
            
            QPushButton {{
                background-color: {colors['primary']};
                color: white;
                border: none;
                padding: 6px 16px;
                border-radius: 4px;
            }}
            
            QPushButton:hover {{
                background-color: {QColor(colors['primary']).lighter(110).name()};
            }}
            
            QPushButton:pressed {{
                background-color: {QColor(colors['primary']).darker(110).name()};
            }}
            
            QPushButton:disabled {{
                background-color: {colors['border']};
                color: {colors['text']['disabled']};
            }}
            
            QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox, QDoubleSpinBox, QDateEdit, QComboBox {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                padding: 4px;
                border-radius: 4px;
                color: {colors['text']['primary']};
            }}
            
            QTabWidget::tab-bar {{
                left: 0px;
            }}
            
            QTabBar::tab {{
                background: {colors['surface']};
                color: {colors['text']['primary']};
                padding: 8px 12px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                border: 1px solid {colors['border']};
                margin-right: 2px;
            }}
            
            QTabBar::tab:selected {{
                background: {colors['background']};
                border-bottom-color: {colors['background']};
            }}
            
            QTabBar::tab:!selected {{
                margin-top: 2px;
            }}
            
            QMenuBar {{
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
            }}
            
            QMenuBar::item {{
                background: transparent;
                padding: 4px 10px;
            }}
            
            QMenuBar::item:selected {{
                background: {colors['primary']};
                color: white;
                border-radius: 4px;
            }}
            
            QMenu {{
                background-color: {colors['background']};
                color: {colors['text']['primary']};
                border: 1px solid {colors['border']};
                border-radius: 4px;
            }}
            
            QMenu::item {{
                padding: 6px 25px 6px 25px;
                border-radius: 4px;
            }}
            
            QMenu::item:selected {{
                background-color: {colors['primary']};
                color: white;
            }}
            
            QStatusBar {{
                background-color: {colors['surface']};
                color: {colors['text']['primary']};
                border-top: 1px solid {colors['border']};
            }}
        """)
    
    def _apply_fonts(self, app):
        """Apply modern font settings to the application"""
        # Set default font
        font = QFont("Segoe UI", 10)  # Use Segoe UI on Windows, will fallback to system font on other platforms
        app.setFont(font)


# Singleton instance for global use
_theme_manager = None

def get_theme_manager():
    """Get or create the singleton ThemeManager instance"""
    global _theme_manager
    if _theme_manager is None:
        _theme_manager = ThemeManager()
    return _theme_manager 