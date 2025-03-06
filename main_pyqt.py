import sys
import os
import traceback
import json
import platform
from pathlib import Path

# Set matplotlib backend explicitly - must be done before importing matplotlib
import matplotlib
matplotlib.use('Qt5Agg')  # Use Qt5Agg backend instead of Qt6Agg for better stability

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout, 
    QHBoxLayout, QLabel, QPushButton, QStatusBar, QMessageBox,
    QSplashScreen, QFrame, QStackedWidget, QToolButton, QSizePolicy
)
from PyQt6.QtGui import QIcon, QAction, QFont, QPixmap, QColor, QPalette, QFontDatabase
from PyQt6.QtCore import Qt, QSize, QSettings, QTimer, QPropertyAnimation, QEasingCurve, pyqtSignal

# Import views
from ui.views.home import HomeView
from ui.views.ledger import LedgerView
from ui.views.cashbook import CashbookView
from ui.views.inventory import InventoryView
from ui.views.payments import PaymentsView
from ui.views.settings import SettingsView
from ui.views.login import LoginView
from ui.views.reports import ReportsView
from ui.views.user_management import UserManagementView

# Import utilities
from ui.utils.logger import get_logger
from ui.utils.theme import get_theme_manager, ThemeType
from ui.utils.responsive import ResponsiveHelper
from ui.utils.constants import APP_VERSION, APP_NAME, ORGANIZATION_NAME
from ui.utils.auth import AuthManager
from ui.models.data_manager import DataManager

# Constants
DEFAULT_WIDTH = 1200
DEFAULT_HEIGHT = 800

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

class SidebarButton(QToolButton):
    """Custom styled sidebar button with icon and text"""
    def __init__(self, text, icon_name=None, parent=None):
        super().__init__(parent)
        self.setText(text)
        self.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextBesideIcon)
        
        if icon_name:
            icon_path = os.path.join("Resources", "icons", f"{icon_name}.png")
            if os.path.exists(icon_path):
                self.setIcon(QIcon(icon_path))
            else:
                # Use a default icon if specific one not found
                default_icon_path = os.path.join("Resources", "icons", "default.png")
                if os.path.exists(default_icon_path):
                    self.setIcon(QIcon(default_icon_path))
        
        self.setCheckable(True)
        self.setMinimumHeight(50)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.setIconSize(QSize(24, 24))
        
        # Custom styling will be applied via themes

class MainWindow(QMainWindow):
    """Main application window with responsive sidebar and content area"""
    authChanged = pyqtSignal(bool)
    
    def __init__(self):
        super().__init__()
        self.logger = get_logger()
        self.logger.info(f"Starting {APP_NAME} {APP_VERSION} application")
        
        # Initialize data manager
        self.data_manager = DataManager()
        
        # Initialize auth manager
        self.auth_manager = AuthManager()
        
        # Setup responsive helper
        self.responsive = ResponsiveHelper()
        
        # Setup window properties
        self.setWindowTitle(APP_NAME)
        self.setMinimumSize(800, 600)
        
        # Load window state
        self.settings = QSettings(ORGANIZATION_NAME, APP_NAME)
        self.load_window_state()
        
        # Track current view
        self.current_view = None
        
        # Setup sidebar width
        self.sidebar_width = 250
        self.sidebar_width_collapsed = 64
        self.sidebar_collapsed = False
        
        # Initialize UI
        self.init_ui()
        self.setup_connections()
        
        # First launch check
        self.check_first_launch()
        
        # Show login if needed or main UI
        self.check_auth_state()
        
        self.logger.info("Application UI initialized")
    
    def init_ui(self):
        """Initialize the main UI components"""
        # Create central widget with horizontal layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # Create sidebar
        self.create_sidebar()
        
        # Create stacked widget for main content
        self.content_stack = QStackedWidget()
        self.main_layout.addWidget(self.content_stack)
        
        # Create login view
        self.login_view = LoginView(self.auth_manager)
        self.login_view.authenticated.connect(self.on_login_success)
        self.content_stack.addWidget(self.login_view)
        
        # Create main content area with tabs
        self.content_widget = QWidget()
        self.content_layout = QVBoxLayout(self.content_widget)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        self.content_stack.addWidget(self.content_widget)
        
        # Create views
        self.create_views()
        
        # Create status bar - Use the QMainWindow's built-in statusBar
        self.statusBar().showMessage("Ready")
        
        # Create menubar
        self.create_menu()
    
    def create_sidebar(self):
        """Create the application sidebar with navigation buttons"""
        self.sidebar = QFrame()
        self.sidebar.setObjectName("sidebar")
        self.sidebar.setMinimumWidth(self.sidebar_width)
        self.sidebar.setMaximumWidth(self.sidebar_width)
        
        self.sidebar_layout = QVBoxLayout(self.sidebar)
        self.sidebar_layout.setContentsMargins(0, 0, 0, 0)
        self.sidebar_layout.setSpacing(4)
        
        # Add header/logo
        self.logo_frame = QFrame()
        self.logo_frame.setMinimumHeight(60)
        self.logo_frame.setMaximumHeight(60)
        logo_layout = QHBoxLayout(self.logo_frame)
        
        self.logo_label = QLabel(APP_NAME)
        self.logo_label.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        self.logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        logo_layout.addWidget(self.logo_label)
        
        self.sidebar_layout.addWidget(self.logo_frame)
        
        # Add separator
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFixedHeight(1)
        self.sidebar_layout.addWidget(separator)
        
        # Create navigation buttons
        self.nav_buttons = {}
        self.nav_buttons["home"] = SidebarButton("Dashboard", "dashboard")
        self.nav_buttons["inventory"] = SidebarButton("Inventory", "inventory")
        self.nav_buttons["pos"] = SidebarButton("Point of Sale", "pos")
        self.nav_buttons["ledger"] = SidebarButton("Stores Ledger", "ledger")
        self.nav_buttons["cashbook"] = SidebarButton("Cash Book", "cashbook")
        self.nav_buttons["payments"] = SidebarButton("Payments", "payments")
        self.nav_buttons["reports"] = SidebarButton("Reports", "reports")
        self.nav_buttons["users"] = SidebarButton("User Management", "users")
        self.nav_buttons["settings"] = SidebarButton("Settings", "settings")
        
        # Add navigation buttons to sidebar
        for button_name, button in self.nav_buttons.items():
            self.sidebar_layout.addWidget(button)
        
        # Add stretch to push everything to the top
        self.sidebar_layout.addStretch(1)
        
        # Add collapse/expand button
        self.toggle_sidebar_btn = QPushButton()
        self.toggle_sidebar_btn.setIcon(QIcon(os.path.join("Resources", "icons", "menu.png")))
        self.toggle_sidebar_btn.setFixedSize(40, 40)
        self.toggle_sidebar_btn.setToolTip("Toggle Sidebar")
        self.toggle_sidebar_btn.clicked.connect(self.toggle_sidebar)
        
        toggle_container = QHBoxLayout()
        toggle_container.addStretch()
        toggle_container.addWidget(self.toggle_sidebar_btn)
        toggle_container.addStretch()
        self.sidebar_layout.addLayout(toggle_container)
        
        # Add spacer at the bottom
        self.sidebar_layout.addSpacing(10)
        
        # Add sidebar to main layout
        self.main_layout.addWidget(self.sidebar)
    
    def create_views(self):
        """Create all application views"""
        try:
            self.logger.debug("Initializing view components")
            
            # Create tab widget for different views
            self.tabs = QStackedWidget()
            self.content_layout.addWidget(self.tabs)
            
            # Create views
            self.home_view = HomeView()
            self.inventory_view = InventoryView()
            self.pos_view = QWidget()  # Placeholder for POS view
            self.ledger_view = LedgerView()
            self.cashbook_view = CashbookView()
            self.payments_view = PaymentsView()
            self.reports_view = ReportsView()
            self.user_management_view = UserManagementView()
            self.settings_view = SettingsView()
            
            # Add views to tab widget
            self.tabs.addWidget(self.home_view)
            self.tabs.addWidget(self.inventory_view)
            self.tabs.addWidget(self.pos_view)
            self.tabs.addWidget(self.ledger_view)
            self.tabs.addWidget(self.cashbook_view)
            self.tabs.addWidget(self.payments_view)
            self.tabs.addWidget(self.reports_view)
            self.tabs.addWidget(self.user_management_view)
            self.tabs.addWidget(self.settings_view)
            
            # Connect navigation buttons to views
            self.nav_buttons["home"].clicked.connect(lambda: self.switch_view(0, "home"))
            self.nav_buttons["inventory"].clicked.connect(lambda: self.switch_view(1, "inventory"))
            self.nav_buttons["pos"].clicked.connect(lambda: self.switch_view(2, "pos"))
            self.nav_buttons["ledger"].clicked.connect(lambda: self.switch_view(3, "ledger"))
            self.nav_buttons["cashbook"].clicked.connect(lambda: self.switch_view(4, "cashbook"))
            self.nav_buttons["payments"].clicked.connect(lambda: self.switch_view(5, "payments"))
            self.nav_buttons["reports"].clicked.connect(lambda: self.switch_view(6, "reports"))
            self.nav_buttons["users"].clicked.connect(lambda: self.switch_view(7, "users"))
            self.nav_buttons["settings"].clicked.connect(lambda: self.switch_view(8, "settings"))
            
            # Set initial view
            self.switch_view(0, "home")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize views: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to initialize application views: {str(e)}")
    
    def create_menu(self):
        """Create the application menu bar"""
        menu_bar = self.menuBar()
        
        # File menu
        file_menu = menu_bar.addMenu("&File")
        
        # Logout action
        logout_action = QAction("&Logout", self)
        logout_action.setShortcut("Ctrl+L")
        logout_action.setStatusTip("Logout from application")
        logout_action.triggered.connect(self.logout)
        file_menu.addAction(logout_action)
        
        file_menu.addSeparator()
        
        # Exit action
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.setStatusTip("Exit application")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # View menu
        view_menu = menu_bar.addMenu("&View")
        
        # Toggle sidebar action
        toggle_sidebar_action = QAction("Toggle &Sidebar", self)
        toggle_sidebar_action.setShortcut("Ctrl+B")
        toggle_sidebar_action.setStatusTip("Toggle sidebar visibility")
        toggle_sidebar_action.triggered.connect(self.toggle_sidebar)
        view_menu.addAction(toggle_sidebar_action)
        
        view_menu.addSeparator()
        
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
        about_action.setStatusTip(f"About {APP_NAME}")
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def setup_connections(self):
        """Setup signal connections"""
        # Connect auth signals
        self.authChanged.connect(self.handle_auth_change)
        
        # Connect theme signals
        theme_manager = get_theme_manager()
        theme_manager.theme_changed.connect(self.apply_theme_styles)
        
        # Connect resize event for responsive UI
        self.responsive.window_resized.connect(self.handle_responsive_ui)
    
    def switch_view(self, index, name):
        """Switch to the specified view"""
        # Update the current view
        self.current_view = name
        
        # Set the active tab
        self.tabs.setCurrentIndex(index)
        
        # Update active button
        for button_name, button in self.nav_buttons.items():
            button.setChecked(button_name == name)
        
        # Update status bar
        self.statusBar().showMessage(f"Viewing {name.capitalize()}")
        
        self.logger.debug(f"Switched to view: {name}")
    
    def toggle_sidebar(self):
        """Toggle sidebar between expanded and collapsed states"""
        target_width = self.sidebar_width_collapsed if not self.sidebar_collapsed else self.sidebar_width
        
        # Create animation
        self.sidebar_animation = QPropertyAnimation(self.sidebar, b"minimumWidth")
        self.sidebar_animation.setDuration(250)
        self.sidebar_animation.setStartValue(self.sidebar.width())
        self.sidebar_animation.setEndValue(target_width)
        self.sidebar_animation.setEasingCurve(QEasingCurve.Type.OutCubic)
        
        # Same for maximum width
        self.sidebar_animation2 = QPropertyAnimation(self.sidebar, b"maximumWidth")
        self.sidebar_animation2.setDuration(250)
        self.sidebar_animation2.setStartValue(self.sidebar.width())
        self.sidebar_animation2.setEndValue(target_width)
        self.sidebar_animation2.setEasingCurve(QEasingCurve.Type.OutCubic)
        
        # Start animations
        self.sidebar_animation.start()
        self.sidebar_animation2.start()
        
        # Update state
        self.sidebar_collapsed = not self.sidebar_collapsed
        
        # Update button tooltips and show/hide text
        for button_name, button in self.nav_buttons.items():
            if self.sidebar_collapsed:
                button.setToolTip(button.text())
                button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonIconOnly)
            else:
                button.setToolTip("")
                button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextBesideIcon)
        
        # Update logo
        if self.sidebar_collapsed:
            self.logo_label.setText("CS")
        else:
            self.logo_label.setText(APP_NAME)
    
    def toggle_theme(self):
        """Toggle between light and dark theme"""
        theme_manager = get_theme_manager()
        current_theme = theme_manager.toggle_theme(QApplication.instance())
        self.statusBar().showMessage(f"Theme changed to {current_theme}")
    
    def apply_theme_styles(self, theme_type):
        """Apply theme-specific styles to components"""
        is_dark = theme_type == ThemeType.DARK
        
        # Apply styles to sidebar
        self.sidebar.setStyleSheet(
            f"background-color: {'#2C3E50' if is_dark else '#F5F5F5'};"
            f"border-right: 1px solid {'#1C2833' if is_dark else '#DDDDDD'};"
        )
        
        # Apply styles to logo
        self.logo_label.setStyleSheet(
            f"color: {'#ECF0F1' if is_dark else '#2C3E50'};"
            f"background-color: {'#1C2833' if is_dark else '#E5E5E5'};"
        )
        
        # Apply styles to navigation buttons
        for button in self.nav_buttons.values():
            button.setStyleSheet(
                f"QToolButton {{"
                f"    color: {'#ECF0F1' if is_dark else '#2C3E50'};"
                f"    background-color: {'transparent'};"
                f"    border: none;"
                f"    border-radius: 4px;"
                f"    text-align: left;"
                f"    padding: 5px 10px;"
                f"}}"
                f"QToolButton:hover {{"
                f"    background-color: {'#34495E' if is_dark else '#E5E5E5'};"
                f"}}"
                f"QToolButton:checked {{"
                f"    background-color: {'#3498DB' if is_dark else '#BBDEFB'};"
                f"    color: {'#FFFFFF' if is_dark else '#1565C0'};"
                f"}}"
            )
    
    def handle_responsive_ui(self, width, height):
        """Handle responsive UI adjustments based on window size"""
        if width < 768 and not self.sidebar_collapsed:
            self.toggle_sidebar()
        elif width >= 1200 and self.sidebar_collapsed:
            self.toggle_sidebar()
    
    def check_first_launch(self):
        """Check if this is the first launch and show welcome dialog if needed"""
        if not self.settings.contains("firstLaunch"):
            self.settings.setValue("firstLaunch", False)
            
            # Show welcome message
            QMessageBox.information(
                self,
                f"Welcome to {APP_NAME}",
                f"Welcome to {APP_NAME} {APP_VERSION}!\n\n"
                f"This appears to be your first time running the application.\n"
                f"The application has been configured with default settings."
            )
    
    def check_auth_state(self):
        """Check authentication state and show login if needed"""
        if self.auth_manager.is_authenticated():
            self.content_stack.setCurrentIndex(1)  # Show main content
            self.sidebar.show()
        else:
            self.content_stack.setCurrentIndex(0)  # Show login
            self.sidebar.hide()
    
    def on_login_success(self):
        """Handle successful login"""
        self.sidebar.show()
        self.content_stack.setCurrentIndex(1)  # Show main content
        self.authChanged.emit(True)
        self.statusBar().showMessage("Logged in successfully")
    
    def logout(self):
        """Log out the current user"""
        self.auth_manager.logout()
        self.content_stack.setCurrentIndex(0)  # Show login
        self.sidebar.hide()
        self.authChanged.emit(False)
        self.statusBar().showMessage("Logged out")
    
    def handle_auth_change(self, is_authenticated):
        """Handle authentication state changes"""
        if is_authenticated:
            self.statusBar().showMessage("User authenticated")
        else:
            self.statusBar().showMessage("User logged out")
    
    def load_window_state(self):
        """Load window state from settings"""
        if self.settings.contains("geometry"):
            self.restoreGeometry(self.settings.value("geometry"))
        if self.settings.contains("windowState"):
            self.restoreState(self.settings.value("windowState"))
        self.logger.debug("Window state loaded from settings")
    
    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(
            self, 
            f"About {APP_NAME}", 
            f"<h1>{APP_NAME}</h1>"
            f"<p>Version {APP_VERSION}</p>"
            f"<p>ERP & POS System for Salt Distribution Management</p>"
            f"<p>&copy; 2024 {ORGANIZATION_NAME}</p>"
            f"<p>Python {platform.python_version()} - PyQt6 on {platform.system()} {platform.release()}</p>"
        )
    
    def resizeEvent(self, event):
        """Handle window resize events"""
        super().resizeEvent(event)
        self.responsive.notify_resize(self.width(), self.height())
    
    def closeEvent(self, event):
        """Handle window close event"""
        # Save window state
        self.settings.setValue("geometry", self.saveGeometry())
        self.settings.setValue("windowState", self.saveState())
        self.logger.info("Application closing, window state saved")
        
        # Handle any pending database operations
        self.data_manager.close()
        
        event.accept()

def create_splash_screen():
    """Create and return a splash screen"""
    splash_path = os.path.join("Resources", "splash.png")
    
    if os.path.exists(splash_path):
        pixmap = QPixmap(splash_path)
    else:
        # Create a default splash screen
        pixmap = QPixmap(400, 300)
        pixmap.fill(QColor("#2196F3"))
    
    splash = QSplashScreen(pixmap)
    
    # Add version info
    font = splash.font()
    font.setPointSize(10)
    splash.setFont(font)
    
    splash.showMessage(
        f"{APP_NAME} {APP_VERSION} - Loading...", 
        Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignCenter,
        QColor("#FFFFFF")
    )
    
    return splash

def load_fonts():
    """Load custom fonts for the application"""
    # Check for Resources/fonts directory
    fonts_dir = Path("Resources/fonts")
    if fonts_dir.exists():
        for font_file in fonts_dir.glob("*.ttf"):
            QFontDatabase.addApplicationFont(str(font_file))

def main():
    # Set exception hook
    sys.excepthook = exception_hook
    
    logger = get_logger()
    logger.info("Application starting")
    
    try:
        app = QApplication(sys.argv)
        
        # Show splash screen
        splash = create_splash_screen()
        splash.show()
        app.processEvents()
        
        # Set application info
        app.setApplicationName(APP_NAME)
        app.setApplicationVersion(APP_VERSION)
        app.setOrganizationName(ORGANIZATION_NAME)
        
        # Load fonts
        load_fonts()
        
        # Apply theme
        theme_manager = get_theme_manager()
        theme_manager.apply_theme(app)
        
        # Create main window
        window = MainWindow()
        
        # Update splash screen
        splash.showMessage(
            "Initializing user interface...",
            Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignCenter,
            QColor("#FFFFFF")
        )
        
        # Check if Resources directory exists
        icon_path = os.path.join("Resources", "icon.png")
        if os.path.exists(icon_path):
            app.setWindowIcon(QIcon(icon_path))
            window.setWindowIcon(QIcon(icon_path))
            logger.debug(f"Application icon set from: {icon_path}")
        
        # Show main window and close splash screen after a slight delay
        QTimer.singleShot(1500, lambda: splash.finish(window))
        window.show()
        
        exit_code = app.exec()
        logger.info(f"Application exited with code: {exit_code}")
        return exit_code
    except Exception as e:
        logger.critical(f"Fatal error in main application: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 