from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QComboBox,
    QTabWidget, QFrame, QFormLayout, QLineEdit, QCheckBox, QMessageBox,
    QRadioButton, QSpinBox, QTableWidget, QTableWidgetItem, QHeaderView,
    QDialog, QDialogButtonBox, QFileDialog, QGroupBox
)
from PyQt6.QtCore import Qt, pyqtSignal, QSettings
from PyQt6.QtGui import QFont, QIcon, QColor

from ui.widgets.base_view import BaseView
from ui.utils.constants import APP_NAME, APP_VERSION, ORGANIZATION_NAME, UserRole
from ui.utils.theme import get_theme_manager, ThemeType

class UserDialog(QDialog):
    """Dialog for adding or editing a user"""
    def __init__(self, parent=None, user_data=None):
        super().__init__(parent)
        self.user_data = user_data  # None for new user, dict for existing user
        self.init_ui()
        self.setWindowTitle("Add User" if not user_data else "Edit User")
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Create form layout
        form_layout = QFormLayout()
        form_layout.setSpacing(10)
        form_layout.setContentsMargins(0, 0, 0, 0)
        
        # Username
        self.username_input = QLineEdit()
        if self.user_data:
            self.username_input.setText(self.user_data.get('username', ''))
            self.username_input.setEnabled(False)  # Can't change username
        form_layout.addRow("Username:", self.username_input)
        
        # Full Name
        self.fullname_input = QLineEdit()
        if self.user_data:
            self.fullname_input.setText(self.user_data.get('full_name', ''))
        form_layout.addRow("Full Name:", self.fullname_input)
        
        # Email
        self.email_input = QLineEdit()
        if self.user_data:
            self.email_input.setText(self.user_data.get('email', ''))
        form_layout.addRow("Email:", self.email_input)
        
        # Role
        self.role_combo = QComboBox()
        roles = [
            UserRole.ADMIN, 
            UserRole.MANAGER, 
            UserRole.CASHIER, 
            UserRole.CLERK, 
            UserRole.VIEWER
        ]
        self.role_combo.addItems(roles)
        if self.user_data and 'role' in self.user_data:
            index = roles.index(self.user_data['role']) if self.user_data['role'] in roles else 0
            self.role_combo.setCurrentIndex(index)
        form_layout.addRow("Role:", self.role_combo)
        
        # Password - only shown for new users
        if not self.user_data:
            self.password_input = QLineEdit()
            self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
            form_layout.addRow("Password:", self.password_input)
            
            self.confirm_password = QLineEdit()
            self.confirm_password.setEchoMode(QLineEdit.EchoMode.Password)
            form_layout.addRow("Confirm Password:", self.confirm_password)
        else:
            # For existing users, provide a button to change password
            password_widget = QWidget()
            password_layout = QHBoxLayout(password_widget)
            password_layout.setContentsMargins(0, 0, 0, 0)
            
            change_password_btn = QPushButton("Change Password")
            change_password_btn.clicked.connect(self.show_change_password)
            password_layout.addWidget(change_password_btn)
            
            form_layout.addRow("Password:", password_widget)
        
        layout.addLayout(form_layout)
        
        # Add buttons
        button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        button_box.accepted.connect(self.validate_and_accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)
        
        # Set dialog size
        self.setMinimumWidth(400)
    
    def show_change_password(self):
        """Show dialog to change password"""
        # In a real app, this would show a password change dialog
        QMessageBox.information(
            self,
            "Change Password",
            "This feature would allow changing the user's password."
        )
    
    def validate_and_accept(self):
        """Validate form before accepting"""
        # Get values
        username = self.username_input.text().strip()
        fullname = self.fullname_input.text().strip()
        email = self.email_input.text().strip()
        role = self.role_combo.currentText()
        
        # Validate required fields
        if not username:
            self.show_error("Username is required")
            return
        
        if not fullname:
            self.show_error("Full name is required")
            return
        
        # Validate password for new users
        if not self.user_data:
            password = self.password_input.text()
            confirm_password = self.confirm_password.text()
            
            if not password:
                self.show_error("Password is required")
                return
            
            if password != confirm_password:
                self.show_error("Passwords do not match")
                return
            
            if len(password) < 6:
                self.show_error("Password must be at least 6 characters")
                return
        
        # All validation passed, accept the dialog
        self.accept()
    
    def show_error(self, message):
        """Show error message"""
        QMessageBox.warning(self, "Validation Error", message)
    
    def get_user_data(self):
        """Get user data from form"""
        data = {
            'username': self.username_input.text().strip(),
            'full_name': self.fullname_input.text().strip(),
            'email': self.email_input.text().strip(),
            'role': self.role_combo.currentText()
        }
        
        # Add password for new users
        if not self.user_data:
            data['password'] = self.password_input.text()
        
        return data

class UserManagementTab(QWidget):
    """User management tab in settings"""
    def __init__(self, auth_manager, parent=None):
        super().__init__(parent)
        self.auth_manager = auth_manager
        self.init_ui()
        self.load_users()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # User table
        self.user_table = QTableWidget()
        self.user_table.setColumnCount(5)
        self.user_table.setHorizontalHeaderLabels(["Username", "Full Name", "Email", "Role", "Actions"])
        self.user_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.user_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.user_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.user_table.setSelectionMode(QTableWidget.SelectionMode.SingleSelection)
        layout.addWidget(self.user_table)
        
        # Button row
        button_layout = QHBoxLayout()
        
        add_user_btn = QPushButton("Add User")
        add_user_btn.clicked.connect(self.add_user)
        button_layout.addWidget(add_user_btn)
        
        button_layout.addStretch()
        
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.load_users)
        button_layout.addWidget(refresh_btn)
        
        layout.addLayout(button_layout)
    
    def load_users(self):
        """Load user list from auth manager"""
        users = self.auth_manager.get_all_users()
        
        if not users:
            self.user_table.setRowCount(0)
            return
        
        self.user_table.setRowCount(len(users))
        for row, user in enumerate(users):
            # Username
            self.user_table.setItem(row, 0, QTableWidgetItem(user.get('username', '')))
            
            # Full Name
            self.user_table.setItem(row, 1, QTableWidgetItem(user.get('full_name', '')))
            
            # Email
            self.user_table.setItem(row, 2, QTableWidgetItem(user.get('email', '')))
            
            # Role
            self.user_table.setItem(row, 3, QTableWidgetItem(user.get('role', '')))
            
            # Actions
            action_widget = QWidget()
            action_layout = QHBoxLayout(action_widget)
            action_layout.setContentsMargins(2, 2, 2, 2)
            action_layout.setSpacing(4)
            
            edit_btn = QPushButton("Edit")
            edit_btn.setStyleSheet("QPushButton { background-color: #2196F3; color: white; }")
            edit_btn.clicked.connect(lambda checked, u=user: self.edit_user(u))
            
            delete_btn = QPushButton("Delete")
            delete_btn.setStyleSheet("QPushButton { background-color: #F44336; color: white; }")
            delete_btn.clicked.connect(lambda checked, u=user: self.delete_user(u))
            
            if user.get('username') == self.auth_manager.get_current_user().username:
                delete_btn.setEnabled(False)  # Can't delete yourself
            
            action_layout.addWidget(edit_btn)
            action_layout.addWidget(delete_btn)
            action_layout.addStretch()
            
            self.user_table.setCellWidget(row, 4, action_widget)
    
    def add_user(self):
        """Show dialog to add a new user"""
        dialog = UserDialog(self)
        result = dialog.exec()
        
        if result == QDialog.DialogCode.Accepted:
            user_data = dialog.get_user_data()
            success, message = self.auth_manager.create_user(
                username=user_data['username'],
                password=user_data['password'],
                full_name=user_data['full_name'],
                role=user_data['role'],
                email=user_data['email']
            )
            
            if success:
                QMessageBox.information(self, "Success", "User created successfully.")
                self.load_users()
            else:
                QMessageBox.warning(self, "Error", f"Failed to create user: {message}")
    
    def edit_user(self, user):
        """Show dialog to edit user"""
        dialog = UserDialog(self, user)
        result = dialog.exec()
        
        if result == QDialog.DialogCode.Accepted:
            QMessageBox.information(self, "Not Implemented", "User editing is not fully implemented in this demo.")
            # In a real application, we would update the user here
            self.load_users()
    
    def delete_user(self, user):
        """Delete a user after confirmation"""
        if not user.get('user_id'):
            QMessageBox.warning(self, "Error", "User ID not found.")
            return
        
        # Ask for confirmation
        confirm = QMessageBox.question(
            self,
            "Confirm Deletion",
            f"Are you sure you want to delete user '{user.get('username')}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if confirm == QMessageBox.StandardButton.Yes:
            success, message = self.auth_manager.delete_user(user.get('user_id'))
            
            if success:
                QMessageBox.information(self, "Success", "User deleted successfully.")
                self.load_users()
            else:
                QMessageBox.warning(self, "Error", f"Failed to delete user: {message}")

class AppearanceTab(QWidget):
    """Appearance settings tab"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = get_theme_manager()
        self.settings = QSettings()
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Theme settings group
        theme_group = QGroupBox("Theme Settings")
        theme_layout = QVBoxLayout(theme_group)
        
        # Theme selection
        theme_label = QLabel("Select Theme:")
        theme_label.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        theme_layout.addWidget(theme_label)
        
        # Light theme option
        self.light_theme_radio = QRadioButton("Light Theme")
        self.light_theme_radio.setChecked(self.theme_manager.current_theme == ThemeType.LIGHT)
        theme_layout.addWidget(self.light_theme_radio)
        
        # Dark theme option
        self.dark_theme_radio = QRadioButton("Dark Theme")
        self.dark_theme_radio.setChecked(self.theme_manager.current_theme == ThemeType.DARK)
        theme_layout.addWidget(self.dark_theme_radio)
        
        theme_layout.addSpacing(20)
        
        # Apply theme button
        apply_theme_btn = QPushButton("Apply Theme")
        apply_theme_btn.clicked.connect(self.apply_theme)
        theme_layout.addWidget(apply_theme_btn)
        
        layout.addWidget(theme_group)
        
        # Font settings group
        font_group = QGroupBox("Font Settings")
        font_layout = QFormLayout(font_group)
        
        # Font size
        self.font_size = QSpinBox()
        self.font_size.setRange(8, 16)
        current_size = self.settings.value("appearance/font_size", 10, type=int)
        self.font_size.setValue(current_size)
        font_layout.addRow("Font Size:", self.font_size)
        
        # Apply font button
        apply_font_btn = QPushButton("Apply Font Settings")
        apply_font_btn.clicked.connect(self.apply_font_settings)
        font_layout.addRow("", apply_font_btn)
        
        layout.addWidget(font_group)
        
        # Other UI options
        ui_group = QGroupBox("UI Options")
        ui_layout = QVBoxLayout(ui_group)
        
        # Show animations
        self.show_animations = QCheckBox("Enable animations")
        self.show_animations.setChecked(self.settings.value("appearance/animations", True, type=bool))
        ui_layout.addWidget(self.show_animations)
        
        # Show tooltips
        self.show_tooltips = QCheckBox("Show tooltips")
        self.show_tooltips.setChecked(self.settings.value("appearance/tooltips", True, type=bool))
        ui_layout.addWidget(self.show_tooltips)
        
        # Dense mode (compact UI)
        self.dense_mode = QCheckBox("Use compact UI")
        self.dense_mode.setChecked(self.settings.value("appearance/dense_mode", False, type=bool))
        ui_layout.addWidget(self.dense_mode)
        
        # Save UI options button
        save_ui_btn = QPushButton("Save UI Options")
        save_ui_btn.clicked.connect(self.save_ui_options)
        ui_layout.addWidget(save_ui_btn)
        
        layout.addWidget(ui_group)
        
        # Add stretch at the end
        layout.addStretch(1)
    
    def apply_theme(self):
        """Apply the selected theme"""
        if self.light_theme_radio.isChecked():
            new_theme = ThemeType.LIGHT
        else:
            new_theme = ThemeType.DARK
        
        # Only change if different from current
        if new_theme != self.theme_manager.current_theme:
            app = QApplication.instance()
            self.theme_manager.current_theme = new_theme
            self.theme_manager.apply_theme(app)
            
            # Save in settings
            self.settings.setValue("appearance/theme", new_theme.value)
            
            QMessageBox.information(self, "Theme Applied", "The theme has been applied successfully.")
    
    def apply_font_settings(self):
        """Apply font settings"""
        font_size = self.font_size.value()
        self.settings.setValue("appearance/font_size", font_size)
        
        # Update font - in a real app, this would update globally
        QMessageBox.information(
            self,
            "Font Settings",
            "Font settings saved. Please restart the application for changes to take effect."
        )
    
    def save_ui_options(self):
        """Save UI options"""
        self.settings.setValue("appearance/animations", self.show_animations.isChecked())
        self.settings.setValue("appearance/tooltips", self.show_tooltips.isChecked())
        self.settings.setValue("appearance/dense_mode", self.dense_mode.isChecked())
        
        QMessageBox.information(
            self,
            "UI Options",
            "UI options saved. Please restart the application for changes to take effect."
        )

class BackupTab(QWidget):
    """Backup and restore settings tab"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Backup section
        backup_group = QGroupBox("Backup Data")
        backup_layout = QVBoxLayout(backup_group)
        
        backup_description = QLabel(
            "Create a backup of your data. This will save all application data "
            "including user accounts, inventory, transactions, and settings."
        )
        backup_description.setWordWrap(True)
        backup_layout.addWidget(backup_description)
        
        backup_btn = QPushButton("Create Backup")
        backup_btn.clicked.connect(self.create_backup)
        backup_layout.addWidget(backup_btn)
        
        layout.addWidget(backup_group)
        
        # Restore section
        restore_group = QGroupBox("Restore Data")
        restore_layout = QVBoxLayout(restore_group)
        
        restore_description = QLabel(
            "Restore data from a backup file. This will replace your current data "
            "with the data from the backup file. This action cannot be undone."
        )
        restore_description.setWordWrap(True)
        restore_layout.addWidget(restore_description)
        
        restore_btn = QPushButton("Restore from Backup")
        restore_btn.clicked.connect(self.restore_backup)
        restore_layout.addWidget(restore_btn)
        
        layout.addWidget(restore_group)
        
        # Auto-backup settings
        auto_backup_group = QGroupBox("Automatic Backup")
        auto_backup_layout = QFormLayout(auto_backup_group)
        
        self.auto_backup = QCheckBox("Enable automatic backup")
        self.auto_backup.setChecked(True)
        auto_backup_layout.addRow("", self.auto_backup)
        
        self.backup_frequency = QComboBox()
        self.backup_frequency.addItems(["Daily", "Weekly", "Monthly"])
        auto_backup_layout.addRow("Backup frequency:", self.backup_frequency)
        
        self.backup_location = QLineEdit()
        self.backup_location.setText("Default location")
        self.backup_location.setReadOnly(True)
        
        location_widget = QWidget()
        location_layout = QHBoxLayout(location_widget)
        location_layout.setContentsMargins(0, 0, 0, 0)
        location_layout.addWidget(self.backup_location)
        
        browse_btn = QPushButton("Browse")
        browse_btn.clicked.connect(self.browse_backup_location)
        location_layout.addWidget(browse_btn)
        
        auto_backup_layout.addRow("Backup location:", location_widget)
        
        save_settings_btn = QPushButton("Save Settings")
        save_settings_btn.clicked.connect(self.save_auto_backup_settings)
        auto_backup_layout.addRow("", save_settings_btn)
        
        layout.addWidget(auto_backup_group)
        
        # Add stretch at the end
        layout.addStretch(1)
    
    def create_backup(self):
        """Create a backup of the application data"""
        # In a real app, this would implement actual backup functionality
        filename, _ = QFileDialog.getSaveFileName(
            self, 
            "Save Backup", 
            f"cowsalt_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip",
            "Backup files (*.zip)"
        )
        
        if filename:
            QMessageBox.information(
                self,
                "Backup Created",
                f"Backup would be created at: {filename}\n\n"
                "Note: This is a demonstration and no actual backup was created."
            )
    
    def restore_backup(self):
        """Restore from a backup file"""
        # In a real app, this would implement actual restore functionality
        filename, _ = QFileDialog.getOpenFileName(
            self, 
            "Open Backup", 
            "",
            "Backup files (*.zip)"
        )
        
        if filename:
            confirm = QMessageBox.warning(
                self,
                "Confirm Restore",
                "Restoring from a backup will replace all current data. This action cannot be undone.\n\n"
                "Do you want to continue?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.No
            )
            
            if confirm == QMessageBox.StandardButton.Yes:
                QMessageBox.information(
                    self,
                    "Restore Complete",
                    f"Data would be restored from: {filename}\n\n"
                    "Note: This is a demonstration and no actual restore was performed."
                )
    
    def browse_backup_location(self):
        """Browse for backup location"""
        directory = QFileDialog.getExistingDirectory(
            self, 
            "Select Backup Directory",
            ""
        )
        
        if directory:
            self.backup_location.setText(directory)
    
    def save_auto_backup_settings(self):
        """Save automatic backup settings"""
        QMessageBox.information(
            self,
            "Settings Saved",
            "Automatic backup settings saved successfully."
        )

class AboutTab(QWidget):
    """About tab with application information"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # App name
        app_name = QLabel(APP_NAME)
        app_name.setFont(QFont("Segoe UI", 24, QFont.Weight.Bold))
        app_name.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(app_name)
        
        # Version
        version = QLabel(f"Version {APP_VERSION}")
        version.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version)
        
        layout.addSpacing(20)
        
        # Description
        description = QLabel("ERP & POS System for Salt Distribution Management")
        description.setWordWrap(True)
        description.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(description)
        
        layout.addSpacing(20)
        
        # Copyright
        copyright = QLabel(f"© 2024 {ORGANIZATION_NAME}. All rights reserved.")
        copyright.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(copyright)
        
        layout.addSpacing(40)
        
        # License info
        license_label = QLabel("License Information")
        license_label.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        license_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(license_label)
        
        license_text = QLabel(
            "This software is licensed under the terms of the MIT License.\n"
            "See LICENSE file for details."
        )
        license_text.setWordWrap(True)
        license_text.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(license_text)
        
        layout.addSpacing(40)
        
        # Credits
        credits_label = QLabel("Credits")
        credits_label.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        credits_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(credits_label)
        
        credits_text = QLabel(
            "Developed by the CowSalt Pro Development Team\n"
            "Built with PyQt6"
        )
        credits_text.setWordWrap(True)
        credits_text.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(credits_text)
        
        # Add stretch at the end
        layout.addStretch(1)

class SettingsView(BaseView):
    """Settings view with multiple tabs for different settings categories"""
    def __init__(self, parent=None):
        super().__init__("Settings", parent)
        self.init_ui()
    
    def init_ui(self):
        # Create tabs widget
        self.tabs = QTabWidget()
        
        # Get auth manager from main window
        main_window = self.parent()
        while main_window and not hasattr(main_window, 'auth_manager'):
            main_window = main_window.parent()
            
        auth_manager = main_window.auth_manager if main_window else None
        
        # Add user management tab (if user has permission)
        if auth_manager and auth_manager.has_permission('manage_users'):
            self.user_management_tab = UserManagementTab(auth_manager)
            self.tabs.addTab(self.user_management_tab, "User Management")
        
        # Add appearance tab
        self.appearance_tab = AppearanceTab()
        self.tabs.addTab(self.appearance_tab, "Appearance")
        
        # Add backup tab
        self.backup_tab = BackupTab()
        self.tabs.addTab(self.backup_tab, "Backup & Restore")
        
        # Add about tab
        self.about_tab = AboutTab()
        self.tabs.addTab(self.about_tab, "About")
        
        # Add tabs to main layout
        self.main_layout.addWidget(self.tabs)
        
        # Add stretch
        self.add_stretch()
    
    def update_view(self):
        """Update the view with fresh data"""
        # Refresh user list if user management tab exists
        if hasattr(self, 'user_management_tab'):
            self.user_management_tab.load_users() 