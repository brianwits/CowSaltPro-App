import sys
import os
import traceback

# Set matplotlib backend explicitly - must be done before importing matplotlib
import matplotlib
matplotlib.use('Qt5Agg')  # Use Qt5Agg backend instead of Qt6Agg

from PyQt6.QtWidgets import (QApplication, QMainWindow, QTabWidget, 
                            QWidget, QVBoxLayout, QHBoxLayout, 
                            QLabel, QPushButton, QStatusBar, QMessageBox)
from PyQt6.QtGui import QIcon, QAction, QFont
from PyQt6.QtCore import Qt, QSize, QSettings

# Import views
from ui.views.home import HomeView
from ui.views.ledger import LedgerView
from ui.views.cashbook import CashbookView
from ui.views.inventory import InventoryView
from ui.views.payments import PaymentsView

# Import utilities
from ui.utils.logger import get_logger
from ui.utils.theme import get_theme_manager

# Global exception hook
def exception_hook(exc_type, exc_value, exc_traceback):
    """Handle uncaught exceptions and log them"""
    logger = get_logger()
    logger.critical("Uncaught exception:", exc_info=(exc_type, exc_value, exc_traceback))
    
    # Format traceback as string
    tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
    tb_text = ''.join(tb_lines)
    
    # Show error dialog
    error_box = QMessageBox()
    error_box.setIcon(QMessageBox.Icon.Critical)
    error_box.setWindowTitle("Application Error")
    error_box.setText(f"An unexpected error occurred: {str(exc_value)}")
    error_box.setDetailedText(tb_text)
    error_box.exec()

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.logger = get_logger()
        self.logger.info("Starting CowSalt Pro application")
        
        self.setWindowTitle("CowSalt Pro")
        self.setMinimumSize(1200, 800)
        
        # Load window state
        self.settings = QSettings("CowSalt", "CowSaltPro")
        self.load_window_state()
        
        # Initialize UI
        self.init_ui()
        self.logger.info("Application UI initialized")
        
    def init_ui(self):
        # Create main widget and layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QVBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Create header
        self.create_header()
        
        # Create tab widget for different views
        self.tabs = QTabWidget()
        self.tabs.setTabPosition(QTabWidget.TabPosition.North)
        self.tabs.setDocumentMode(True)
        
        try:
            # Add tabs
            self.logger.debug("Initializing view components")
            self.home_view = HomeView()
            self.ledger_view = LedgerView()
            self.cashbook_view = CashbookView()
            self.inventory_view = InventoryView()
            self.payments_view = PaymentsView()
            
            self.tabs.addTab(self.home_view, "Home")
            self.tabs.addTab(self.ledger_view, "Stores Ledger")
            self.tabs.addTab(self.cashbook_view, "Cash Book")
            self.tabs.addTab(self.inventory_view, "Inventory")
            self.tabs.addTab(self.payments_view, "Payments")
            
            # Connect tab changed signal
            self.tabs.currentChanged.connect(self.on_tab_changed)
            
            self.main_layout.addWidget(self.tabs)
        except Exception as e:
            self.logger.error(f"Failed to initialize views: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to initialize application views: {str(e)}")
        
        # Create footer
        self.create_footer()
        
        # Create status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready")
        
        # Create menubar
        self.create_menu()
        
    def create_header(self):
        header = QWidget()
        header_layout = QHBoxLayout(header)
        
        # Title
        title_label = QLabel("CowSalt Pro")
        title_label.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        
        # Add widgets to layout
        header_layout.addWidget(title_label)
        header_layout.addStretch(1)
        
        # User profile button (placeholder)
        profile_button = QPushButton("Profile")
        header_layout.addWidget(profile_button)
        
        header.setMaximumHeight(60)
        self.main_layout.addWidget(header)
        
    def create_footer(self):
        footer = QWidget()
        footer_layout = QHBoxLayout(footer)
        
        # Copyright info
        copyright_label = QLabel("© 2024 CowSalt Pro")
        footer_layout.addWidget(copyright_label)
        footer_layout.addStretch(1)
        
        # Version info
        version_label = QLabel("v1.0.0")
        footer_layout.addWidget(version_label)
        
        footer.setMaximumHeight(30)
        self.main_layout.addWidget(footer)
        
    def create_menu(self):
        menu_bar = self.menuBar()
        
        # File menu
        file_menu = menu_bar.addMenu("&File")
        
        # Exit action
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.setStatusTip("Exit application")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # View menu
        view_menu = menu_bar.addMenu("&View")
        
        # Toggle theme action
        toggle_theme_action = QAction("Toggle &Theme", self)
        toggle_theme_action.setShortcut("Ctrl+T")
        toggle_theme_action.setStatusTip("Toggle between light and dark theme")
        toggle_theme_action.triggered.connect(self.toggle_theme)
        view_menu.addAction(toggle_theme_action)
        
        # Help menu
        help_menu = menu_bar.addMenu("&Help")
        
        # About action
        about_action = QAction("&About", self)
        about_action.setStatusTip("About CowSalt Pro")
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
        
    def load_window_state(self):
        """Load window state from settings"""
        if self.settings.contains("geometry"):
            self.restoreGeometry(self.settings.value("geometry"))
        if self.settings.contains("windowState"):
            self.restoreState(self.settings.value("windowState"))
        self.logger.debug("Window state loaded from settings")
        
    def on_tab_changed(self, index):
        """Handle tab changed event"""
        tab_name = self.tabs.tabText(index)
        self.logger.debug(f"Switched to tab: {tab_name}")
        self.status_bar.showMessage(f"Viewing {tab_name}")
        
    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(self, "About CowSalt Pro", 
                         """<h1>CowSalt Pro</h1>
                         <p>Version 1.0.0</p>
                         <p>ERP & POS System for Cow Salt Production</p>
                         <p>&copy; 2024 CowSalt Pro</p>""")
        
    def toggle_theme(self):
        """Toggle between light and dark theme"""
        theme_manager = get_theme_manager()
        current_theme = theme_manager.toggle_theme(QApplication.instance())
        self.status_bar.showMessage(f"Theme changed to {current_theme}")
        
    def closeEvent(self, event):
        """Save window state when closing"""
        self.settings.setValue("geometry", self.saveGeometry())
        self.settings.setValue("windowState", self.saveState())
        self.logger.info("Application closing, window state saved")
        event.accept()

def main():
    # Set exception hook
    sys.excepthook = exception_hook
    
    logger = get_logger()
    logger.info("Application starting")
    
    try:
        app = QApplication(sys.argv)
        
        # Apply theme
        theme_manager = get_theme_manager()
        theme_manager.apply_theme(app)
        
        # Set application info
        app.setApplicationName("CowSalt Pro")
        app.setApplicationVersion("1.0.0")
        app.setOrganizationName("CowSalt")
        
        # Check if Resources directory exists
        icon_path = os.path.join("Resources", "icon.png")
        if os.path.exists(icon_path):
            app.setWindowIcon(QIcon(icon_path))
            logger.debug(f"Application icon set from: {icon_path}")
        
        window = MainWindow()
        window.show()
        
        exit_code = app.exec()
        logger.info(f"Application exited with code: {exit_code}")
        return exit_code
    except Exception as e:
        logger.critical(f"Fatal error in main application: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 