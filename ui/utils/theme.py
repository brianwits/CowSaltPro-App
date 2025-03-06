from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QPalette, QColor
from PyQt6.QtCore import Qt, QSettings

from ui.utils.logger import get_logger

class ThemeManager:
    """
    Manages application theming.
    Provides light and dark themes and preserves user theme preferences.
    """
    def __init__(self):
        self.logger = get_logger()
        self.settings = QSettings("CowSalt", "CowSaltPro")
        self.current_theme = self.settings.value("theme", "light")
        
    def apply_theme(self, app, theme=None):
        """Apply a theme to the application"""
        if theme:
            self.current_theme = theme
        else:
            theme = self.current_theme
            
        self.logger.info(f"Applying theme: {theme}")
        
        if theme == "dark":
            self._apply_dark_theme(app)
        else:
            self._apply_light_theme(app)
            
        # Save theme preference
        self.settings.setValue("theme", self.current_theme)
        
    def toggle_theme(self, app):
        """Toggle between light and dark themes"""
        if self.current_theme == "light":
            self.apply_theme(app, "dark")
        else:
            self.apply_theme(app, "light")
        
        return self.current_theme
        
    def _apply_light_theme(self, app):
        """Apply light theme to the application"""
        # Default is already light theme, but we'll customize it a bit
        app.setStyle("Fusion")
        
        # Apply a slightly customized palette
        palette = QPalette()
        
        # Set colors as RGB tuple
        palette.setColor(QPalette.ColorRole.Window, QColor(240, 240, 240))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(0, 0, 0))
        palette.setColor(QPalette.ColorRole.Base, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(233, 233, 233))
        palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.ToolTipText, QColor(0, 0, 0))
        palette.setColor(QPalette.ColorRole.Text, QColor(0, 0, 0))
        palette.setColor(QPalette.ColorRole.Button, QColor(240, 240, 240))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(0, 0, 0))
        palette.setColor(QPalette.ColorRole.BrightText, QColor(255, 0, 0))
        palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
        palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor(255, 255, 255))
        
        # Apply the palette
        app.setPalette(palette)
        
    def _apply_dark_theme(self, app):
        """Apply dark theme to the application"""
        app.setStyle("Fusion")
        
        # Create a dark palette
        palette = QPalette()
        
        # Set colors as RGB tuple
        palette.setColor(QPalette.ColorRole.Window, QColor(53, 53, 53))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Base, QColor(25, 25, 25))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(53, 53, 53))
        palette.setColor(QPalette.ColorRole.ToolTipBase, QColor(53, 53, 53))
        palette.setColor(QPalette.ColorRole.ToolTipText, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Text, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Button, QColor(53, 53, 53))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.BrightText, QColor(255, 0, 0))
        palette.setColor(QPalette.ColorRole.Link, QColor(42, 130, 218))
        palette.setColor(QPalette.ColorRole.Highlight, QColor(42, 130, 218))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor(255, 255, 255))
        
        # Apply the palette
        app.setPalette(palette)

# Create singleton instance
theme_manager = ThemeManager()

def get_theme_manager():
    """Get the theme manager singleton"""
    return theme_manager 