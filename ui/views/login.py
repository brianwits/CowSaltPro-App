import os
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton, QFrame,
    QHBoxLayout, QCheckBox, QMessageBox, QGraphicsDropShadowEffect, QSizePolicy
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QPropertyAnimation, QEasingCurve, QTimer
from PyQt6.QtGui import QPixmap, QIcon, QColor, QFont, QPainter, QPalette

from ui.utils.constants import APP_NAME, APP_VERSION, ORGANIZATION_NAME

class FlatButton(QPushButton):
    """Custom flat button with hover effect"""
    def __init__(self, text, parent=None):
        super().__init__(text, parent)
        self.setFlat(True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        
        # Set default style
        self.default_style = """
            QPushButton {
                color: #2196F3;
                background-color: transparent;
                border: none;
                text-align: left;
                padding: 5px;
            }
            QPushButton:hover {
                color: #1976D2;
                text-decoration: underline;
            }
        """
        self.setStyleSheet(self.default_style)

class LoginView(QWidget):
    """Login view for user authentication"""
    # Signal emitted upon successful authentication
    authenticated = pyqtSignal()
    
    def __init__(self, auth_manager, parent=None):
        super().__init__(parent)
        self.auth_manager = auth_manager
        self.init_ui()
        
    def init_ui(self):
        # Main layout
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Left side - branding
        branding_panel = QFrame()
        branding_panel.setObjectName("branding_panel")
        branding_panel.setStyleSheet("""
            #branding_panel {
                background-color: #1976D2;
            }
        """)
        
        branding_layout = QVBoxLayout(branding_panel)
        branding_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Logo placeholder
        logo_path = os.path.join("Resources", "logo.png")
        if os.path.exists(logo_path):
            logo_label = QLabel()
            logo_pixmap = QPixmap(logo_path)
            scaled_pixmap = logo_pixmap.scaled(
                QSize(200, 200),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            )
            logo_label.setPixmap(scaled_pixmap)
            logo_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            branding_layout.addWidget(logo_label)
        
        # App name
        app_name_label = QLabel(APP_NAME)
        app_name_label.setFont(QFont("Segoe UI", 24, QFont.Weight.Bold))
        app_name_label.setStyleSheet("color: white;")
        app_name_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        branding_layout.addWidget(app_name_label)
        
        # Tagline
        tagline_label = QLabel("ERP & POS System for Salt Distribution Management")
        tagline_label.setFont(QFont("Segoe UI", 12))
        tagline_label.setStyleSheet("color: rgba(255, 255, 255, 0.8);")
        tagline_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        branding_layout.addWidget(tagline_label)
        
        # Version
        version_label = QLabel(f"Version {APP_VERSION}")
        version_label.setStyleSheet("color: rgba(255, 255, 255, 0.6);")
        version_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        branding_layout.addSpacing(20)
        branding_layout.addWidget(version_label)
        
        # Right side - login form
        login_panel = QFrame()
        login_panel.setObjectName("login_panel")
        login_panel.setStyleSheet("""
            #login_panel {
                background-color: white;
            }
        """)
        
        # Add shadow to login panel
        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(20)
        shadow.setColor(QColor(0, 0, 0, 80))
        shadow.setOffset(0, 0)
        login_panel.setGraphicsEffect(shadow)
        
        login_layout = QVBoxLayout(login_panel)
        login_layout.setContentsMargins(40, 60, 40, 60)
        
        # Welcome text
        welcome_label = QLabel("Welcome Back")
        welcome_label.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        welcome_label.setStyleSheet("color: #2C3E50;")
        login_layout.addWidget(welcome_label)
        
        login_instruction = QLabel("Please sign in to your account")
        login_instruction.setStyleSheet("color: #7F8C8D; margin-bottom: 30px;")
        login_layout.addWidget(login_instruction)
        login_layout.addSpacing(20)
        
        # Username field
        username_label = QLabel("Username")
        username_label.setFont(QFont("Segoe UI", 10))
        login_layout.addWidget(username_label)
        
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Enter your username")
        self.username_input.setMinimumHeight(40)
        self.username_input.setStyleSheet("""
            QLineEdit {
                border: 1px solid #E0E0E0;
                border-radius: 4px;
                padding: 8px;
                background-color: #F5F5F5;
                margin-bottom: 15px;
            }
            QLineEdit:focus {
                border: 1px solid #2196F3;
                background-color: white;
            }
        """)
        login_layout.addWidget(self.username_input)
        
        # Password field
        password_label = QLabel("Password")
        password_label.setFont(QFont("Segoe UI", 10))
        login_layout.addWidget(password_label)
        
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Enter your password")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.password_input.setMinimumHeight(40)
        self.password_input.setStyleSheet("""
            QLineEdit {
                border: 1px solid #E0E0E0;
                border-radius: 4px;
                padding: 8px;
                background-color: #F5F5F5;
                margin-bottom: 5px;
            }
            QLineEdit:focus {
                border: 1px solid #2196F3;
                background-color: white;
            }
        """)
        login_layout.addWidget(self.password_input)
        
        # Remember me & forgot password
        options_layout = QHBoxLayout()
        
        self.remember_checkbox = QCheckBox("Remember me")
        self.remember_checkbox.setStyleSheet("""
            QCheckBox {
                color: #7F8C8D;
            }
            QCheckBox::indicator {
                width: 18px;
                height: 18px;
            }
            QCheckBox::indicator:unchecked {
                border: 1px solid #E0E0E0;
                background-color: white;
                border-radius: 3px;
            }
            QCheckBox::indicator:checked {
                background-color: #2196F3;
                border: 1px solid #2196F3;
                border-radius: 3px;
            }
        """)
        options_layout.addWidget(self.remember_checkbox)
        
        options_layout.addStretch()
        
        forgot_password_button = FlatButton("Forgot password?")
        forgot_password_button.clicked.connect(self.forgot_password)
        options_layout.addWidget(forgot_password_button)
        
        login_layout.addLayout(options_layout)
        login_layout.addSpacing(30)
        
        # Login button
        self.login_button = QPushButton("Sign In")
        self.login_button.setMinimumHeight(50)
        self.login_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.login_button.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
            QPushButton:pressed {
                background-color: #0D47A1;
            }
        """)
        self.login_button.clicked.connect(self.handle_login)
        login_layout.addWidget(self.login_button)
        
        # Error message
        self.error_label = QLabel("")
        self.error_label.setStyleSheet("color: #E74C3C; margin-top: 10px;")
        self.error_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.error_label.setVisible(False)
        login_layout.addWidget(self.error_label)
        
        login_layout.addStretch()
        
        # Set up layout ratio (40% left, 60% right)
        main_layout.addWidget(branding_panel, 40)
        main_layout.addWidget(login_panel, 60)
        
        # Connect enter key press
        self.username_input.returnPressed.connect(self.focus_password)
        self.password_input.returnPressed.connect(self.handle_login)
        
        # Initial focus
        self.username_input.setFocus()
        
    def focus_password(self):
        """Move focus to password field"""
        self.password_input.setFocus()
        
    def handle_login(self):
        """Process login attempt"""
        # Clear previous error
        self.error_label.setVisible(False)
        
        # Get credentials
        username = self.username_input.text().strip()
        password = self.password_input.text()
        
        # Basic validation
        if not username:
            self.show_error("Please enter your username")
            self.username_input.setFocus()
            return
            
        if not password:
            self.show_error("Please enter your password")
            self.password_input.setFocus()
            return
        
        # Show loading state
        self.login_button.setEnabled(False)
        self.login_button.setText("Signing in...")
        
        # Attempt login
        success, message = self.auth_manager.login(username, password)
        
        if success:
            # Login successful
            self.authenticated.emit()
        else:
            # Login failed
            self.show_error(message)
            self.login_button.setEnabled(True)
            self.login_button.setText("Sign In")
            self.password_input.setFocus()
            self.password_input.selectAll()
    
    def show_error(self, message):
        """Display error message"""
        self.error_label.setText(message)
        self.error_label.setVisible(True)
        
        # Animation for attention
        original_style = self.error_label.styleSheet()
        self.error_label.setStyleSheet("color: #E74C3C; margin-top: 10px; background-color: #FADBD8; padding: 5px; border-radius: 4px;")
        
        # Reset style after a delay
        QTimer.singleShot(100, lambda: self.error_label.setStyleSheet(original_style))
    
    def forgot_password(self):
        """Handle forgot password click"""
        QMessageBox.information(
            self,
            "Forgot Password",
            "Please contact your administrator to reset your password.\n\n"
            "For the demo version, use:\nUsername: admin\nPassword: admin"
        )

# For testing the login view directly
if __name__ == "__main__":
    import sys
    from PyQt6.QtWidgets import QApplication
    from ui.utils.auth import AuthManager
    
    app = QApplication(sys.argv)
    auth_manager = AuthManager()
    login_view = LoginView(auth_manager)
    login_view.show()
    sys.exit(app.exec()) 