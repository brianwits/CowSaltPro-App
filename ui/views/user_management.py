from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTableWidget, QTableWidgetItem, 
    QPushButton, QHeaderView, QMessageBox, QDialog, QFormLayout, QLineEdit, 
    QComboBox, QDialogButtonBox, QCheckBox, QFrame, QSplitter, QToolBar,
    QStatusBar, QApplication, QStyle, QMenu, QToolButton, QSizePolicy,
    QCompleter, QRadioButton, QButtonGroup, QPushButton
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QTimer, QDateTime
from PyQt6.QtGui import QFont, QIcon, QColor, QAction, QPixmap

from ui.widgets.base_view import BaseView
from ui.utils.constants import UserRole
from ui.utils.logger import get_logger
import datetime
import string

class PasswordResetDialog(QDialog):
    """Dialog for resetting a user's password"""
    def __init__(self, parent=None, username=None):
        super().__init__(parent)
        self.username = username
        self.setWindowTitle(f"Reset Password - {username}")
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Instructions
        info_label = QLabel(
            f"Set a new password for user <b>{self.username}</b>.<br><br>"
            "The user will be required to change their password on next login."
        )
        info_label.setWordWrap(True)
        layout.addWidget(info_label)
        
        # Form layout for the password fields
        form_layout = QFormLayout()
        
        # New password field
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.password_input.setPlaceholderText("Enter new password")
        form_layout.addRow("New Password:", self.password_input)
        
        # Confirm password field
        self.confirm_password = QLineEdit()
        self.confirm_password.setEchoMode(QLineEdit.EchoMode.Password)
        self.confirm_password.setPlaceholderText("Confirm new password")
        form_layout.addRow("Confirm Password:", self.confirm_password)
        
        # Password strength indicator
        self.strength_label = QLabel("Password Strength: Not Set")
        form_layout.addRow("", self.strength_label)
        
        # Connect textChanged signal to update password strength
        self.password_input.textChanged.connect(self.update_password_strength)
        
        layout.addLayout(form_layout)
        
        # Generate random password button
        generate_btn = QPushButton("Generate Strong Password")
        generate_btn.clicked.connect(self.generate_password)
        layout.addWidget(generate_btn)
        
        # Add buttons
        button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        button_box.accepted.connect(self.validate_and_accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)
        
        self.setMinimumWidth(400)
        
    def update_password_strength(self):
        """Update password strength indicator"""
        password = self.password_input.text()
        
        if not password:
            self.strength_label.setText("Password Strength: Not Set")
            self.strength_label.setStyleSheet("color: gray;")
            return
            
        # Calculate password strength
        strength = 0
        feedback = []
        
        # Length check
        if len(password) >= 12:
            strength += 2
        elif len(password) >= 8:
            strength += 1
        else:
            feedback.append("Password is too short")
            
        # Complexity checks
        if any(c.isupper() for c in password):
            strength += 1
        else:
            feedback.append("Add uppercase letters")
            
        if any(c.islower() for c in password):
            strength += 1
        else:
            feedback.append("Add lowercase letters")
            
        if any(c.isdigit() for c in password):
            strength += 1
        else:
            feedback.append("Add numbers")
            
        if any(not c.isalnum() for c in password):
            strength += 1
        else:
            feedback.append("Add special characters")
            
        # Determine strength level
        if strength >= 5:
            level = "Strong"
            color = "green"
        elif strength >= 3:
            level = "Medium"
            color = "orange"
        else:
            level = "Weak"
            color = "red"
            
        # Update the label
        if feedback:
            self.strength_label.setText(f"Password Strength: {level} - {'; '.join(feedback)}")
        else:
            self.strength_label.setText(f"Password Strength: {level}")
            
        self.strength_label.setStyleSheet(f"color: {color};")
        
    def generate_password(self):
        """Generate a random strong password"""
        import random
        
        # Define character sets
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special = "!@#$%^&*()-_=+[]{}|;:,.<>?"
        
        # Ensure at least one of each type
        password = [
            random.choice(uppercase),
            random.choice(lowercase),
            random.choice(digits),
            random.choice(special)
        ]
        
        # Add more random characters to reach desired length
        length = random.randint(10, 14)  # Random length between 10-14
        for _ in range(length - 4):
            password.append(random.choice(uppercase + lowercase + digits + special))
            
        # Shuffle the password characters
        random.shuffle(password)
        password = ''.join(password)
        
        # Set the password in the fields
        self.password_input.setText(password)
        self.confirm_password.setText(password)
        self.update_password_strength()
        
    def validate_and_accept(self):
        """Validate the password before accepting"""
        password = self.password_input.text()
        confirm = self.confirm_password.text()
        
        if not password:
            QMessageBox.warning(self, "Error", "Please enter a password.")
            return
            
        if password != confirm:
            QMessageBox.warning(self, "Error", "Passwords do not match.")
            return
            
        if len(password) < 6:
            QMessageBox.warning(self, "Error", "Password must be at least 6 characters long.")
            return
            
        self.accept()
        
    def get_password(self):
        """Return the new password"""
        return self.password_input.text()

class UserPermissionsDialog(QDialog):
    """Dialog for managing user permissions"""
    def __init__(self, parent=None, user_data=None):
        super().__init__(parent)
        self.user_data = user_data
        self.setWindowTitle(f"User Permissions - {user_data.get('username', 'Unknown')}")
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # User info
        info_layout = QHBoxLayout()
        
        # User icon
        icon_label = QLabel()
        icon = QApplication.style().standardIcon(QStyle.StandardPixmap.SP_DialogApplyButton)
        icon_label.setPixmap(icon.pixmap(48, 48))
        info_layout.addWidget(icon_label)
        
        # User details
        user_info = QLabel()
        user_info.setText(
            f"<h3>{self.user_data.get('full_name', 'Unknown')}</h3>"
            f"<p>Username: {self.user_data.get('username', 'Unknown')}<br>"
            f"Role: {self.user_data.get('role', 'Unknown')}</p>"
        )
        info_layout.addWidget(user_info, 1)
        
        layout.addLayout(info_layout)
        
        # Horizontal line
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setFrameShadow(QFrame.Shadow.Sunken)
        layout.addWidget(line)
        
        # Info label
        permissions_info = QLabel(
            "Select the permissions for this user. Permissions marked with an asterisk (*) "
            "are automatically granted based on the user's role and cannot be changed."
        )
        permissions_info.setWordWrap(True)
        layout.addWidget(permissions_info)
        
        # Create permission checkboxes
        permissions_layout = QVBoxLayout()
        
        # Define permissions by category
        permission_categories = {
            "Sales": [
                ("process_sales", "Process Sales"),
                ("manage_discounts", "Manage Discounts"),
                ("void_transactions", "Void Transactions"),
                ("view_sales_history", "View Sales History")
            ],
            "Inventory": [
                ("view_inventory", "View Inventory"),
                ("add_inventory", "Add Inventory Items"),
                ("edit_inventory", "Edit Inventory Items"),
                ("delete_inventory", "Delete Inventory Items")
            ],
            "Customers": [
                ("view_customers", "View Customers"),
                ("add_customers", "Add Customers"),
                ("edit_customers", "Edit Customers"),
                ("delete_customers", "Delete Customers")
            ],
            "Reports": [
                ("view_reports", "View Reports"),
                ("export_reports", "Export Reports"),
                ("create_reports", "Create Custom Reports")
            ],
            "System": [
                ("manage_users", "Manage Users"),
                ("system_settings", "Change System Settings"),
                ("view_logs", "View System Logs"),
                ("backup_restore", "Backup and Restore")
            ]
        }
        
        # Get role-based permissions
        role = self.user_data.get('role', '')
        role_permissions = self.get_role_permissions(role)
        
        self.permission_checkboxes = {}
        
        # Add each permission category
        for category, permissions in permission_categories.items():
            # Category label
            category_label = QLabel(f"<b>{category}</b>")
            permissions_layout.addWidget(category_label)
            
            # Permissions for this category
            for perm_id, perm_name in permissions:
                checkbox = QCheckBox(perm_name)
                
                # Check if this permission is granted by role
                is_role_permission = perm_id in role_permissions
                
                if is_role_permission:
                    checkbox.setText(f"{perm_name} *")
                    checkbox.setChecked(True)
                    checkbox.setEnabled(False)
                    checkbox.setToolTip(f"Automatically granted by {role} role")
                else:
                    # Check if user has this custom permission
                    user_permissions = self.user_data.get('permissions', [])
                    checkbox.setChecked(perm_id in user_permissions)
                
                self.permission_checkboxes[perm_id] = checkbox
                permissions_layout.addWidget(checkbox)
            
            # Add some spacing between categories
            permissions_layout.addSpacing(10)
        
        # Add scrollable area if needed
        scroll_area = QWidget()
        scroll_area.setLayout(permissions_layout)
        layout.addWidget(scroll_area)
        
        # Buttons
        button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)
        
        # Set dialog size
        self.setMinimumWidth(500)
        self.setMinimumHeight(500)
        
    def get_role_permissions(self, role):
        """Get permissions automatically granted by a role"""
        # This would ideally come from a configuration file or database
        role_permissions = {
            UserRole.ADMIN: [
                "process_sales", "manage_discounts", "void_transactions", "view_sales_history",
                "view_inventory", "add_inventory", "edit_inventory", "delete_inventory",
                "view_customers", "add_customers", "edit_customers", "delete_customers",
                "view_reports", "export_reports", "create_reports",
                "manage_users", "system_settings", "view_logs", "backup_restore"
            ],
            UserRole.MANAGER: [
                "process_sales", "manage_discounts", "void_transactions", "view_sales_history",
                "view_inventory", "add_inventory", "edit_inventory",
                "view_customers", "add_customers", "edit_customers",
                "view_reports", "export_reports",
                "view_logs"
            ],
            UserRole.CASHIER: [
                "process_sales", "view_sales_history",
                "view_inventory",
                "view_customers", "add_customers",
                "view_reports"
            ],
            UserRole.CLERK: [
                "view_inventory", "add_inventory",
                "view_customers",
                "view_reports"
            ],
            UserRole.VIEWER: [
                "view_inventory",
                "view_customers",
                "view_reports"
            ]
        }
        
        return role_permissions.get(role, [])
        
    def get_permissions(self):
        """Get the selected permissions"""
        permissions = []
        
        for perm_id, checkbox in self.permission_checkboxes.items():
            if checkbox.isChecked() and checkbox.isEnabled():
                permissions.append(perm_id)
                
        return permissions


class UserManagementView(BaseView):
    """User management view for managing system users"""
    def __init__(self, parent=None):
        super().__init__("User Management", parent)
        self.logger = get_logger()
        self.init_ui()
    
    def init_ui(self):
        # Get auth manager from main window (if available)
        try:
            main_window = self.parent()
            while main_window and not hasattr(main_window, 'auth_manager'):
                main_window = main_window.parent()
                
            self.auth_manager = main_window.auth_manager if main_window else None
            
            # If auth manager not available, show message
            if not self.auth_manager:
                # Try to create an auth manager directly as a fallback
                try:
                    from ui.utils.auth import AuthManager
                    self.auth_manager = AuthManager()
                    self.logger.info("Created fallback AuthManager for UserManagementView")
                except Exception as e:
                    self.logger.error(f"Failed to create fallback AuthManager: {str(e)}")
                    error_label = QLabel("Authentication manager not available.\nUnable to manage users.")
                    error_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
                    self.main_layout.addWidget(error_label)
                    return
                
            # Check if user has permission
            if not self.auth_manager.has_permission('manage_users'):
                error_label = QLabel("You don't have permission to access this feature.")
                error_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
                self.main_layout.addWidget(error_label)
                return
        except Exception as e:
            self.logger.error(f"Error initializing auth manager: {str(e)}")
            error_label = QLabel(f"Error initializing user management: {str(e)}")
            error_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.main_layout.addWidget(error_label)
            return
        
        # Toolbar
        toolbar = QToolBar()
        toolbar.setIconSize(QSize(24, 24))
        
        # Add User action
        add_user_action = QAction(
            QApplication.style().standardIcon(QStyle.StandardPixmap.SP_DialogApplyButton),
            "Add User", 
            self
        )
        add_user_action.triggered.connect(self.add_user)
        toolbar.addAction(add_user_action)
        
        # Refresh action
        refresh_action = QAction(
            QApplication.style().standardIcon(QStyle.StandardPixmap.SP_BrowserReload),
            "Refresh", 
            self
        )
        refresh_action.triggered.connect(self.load_users)
        toolbar.addAction(refresh_action)
        
        toolbar.addSeparator()
        
        # Filter field
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search users...")
        self.search_input.setClearButtonEnabled(True)
        self.search_input.textChanged.connect(self.filter_users)
        toolbar.addWidget(self.search_input)
        
        # Filter by role
        self.role_filter = QComboBox()
        self.role_filter.addItem("All Roles")
        self.role_filter.addItems([
            UserRole.ADMIN, 
            UserRole.MANAGER, 
            UserRole.CASHIER, 
            UserRole.CLERK, 
            UserRole.VIEWER
        ])
        self.role_filter.currentTextChanged.connect(self.filter_users)
        toolbar.addWidget(self.role_filter)
        
        self.main_layout.addWidget(toolbar)
            
        # Add description
        description = QLabel(
            "Manage system users, roles, and permissions. Add new users, edit user information, "
            "or remove users from the system."
        )
        description.setWordWrap(True)
        self.main_layout.addWidget(description)
        self.main_layout.addSpacing(10)
        
        # User table
        self.add_section_header("Users")
        
        self.user_table = QTableWidget()
        self.user_table.setColumnCount(6)
        self.user_table.setHorizontalHeaderLabels(["Username", "Full Name", "Email", "Role", "Last Login", "Actions"])
        self.user_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.user_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.user_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.user_table.setSelectionMode(QTableWidget.SelectionMode.SingleSelection)
        self.user_table.setAlternatingRowColors(True)
        self.user_table.setStyleSheet("""
            QTableWidget {
                gridline-color: #d4d4d4;
                selection-background-color: #e0f2f1;
                selection-color: #2c3e50;
            }
            QHeaderView::section {
                background-color: #f5f5f5;
                padding: 6px;
                border: 1px solid #d4d4d4;
                font-weight: bold;
            }
        """)
        self.main_layout.addWidget(self.user_table)
        
        # Status bar with counts
        self.status_bar = QStatusBar()
        self.user_count_label = QLabel("0 users")
        self.status_bar.addPermanentWidget(self.user_count_label)
        self.main_layout.addWidget(self.status_bar)
        
        # Button row
        button_layout = QHBoxLayout()
        
        add_user_btn = QPushButton("Add User")
        add_user_btn.setMinimumHeight(40)
        add_user_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
            QPushButton:pressed {
                background-color: #0D47A1;
            }
        """)
        add_user_btn.clicked.connect(self.add_user)
        button_layout.addWidget(add_user_btn)
        
        button_layout.addStretch()
        
        refresh_btn = QPushButton("Refresh")
        refresh_btn.setMinimumHeight(40)
        refresh_btn.clicked.connect(self.load_users)
        button_layout.addWidget(refresh_btn)
        
        self.main_layout.addLayout(button_layout)
        
        # Add roles section
        self.add_section_header("Roles and Permissions")
        
        roles_description = QLabel(
            "User roles define what actions users can perform in the system. "
            "The following roles are available:"
        )
        roles_description.setWordWrap(True)
        self.main_layout.addWidget(roles_description)
        
        # Add role descriptions
        role_descriptions = {
            "Admin": "Full access to all features and settings",
            "Manager": "Full access to business operations, but cannot manage users",
            "Cashier": "Can process sales, manage cash, and view reports",
            "Clerk": "Can manage inventory and view data",
            "Viewer": "Read-only access to data and reports"
        }
        
        roles_layout = QVBoxLayout()
        for role, description in role_descriptions.items():
            role_label = QLabel(f"<b>{role}:</b> {description}")
            role_label.setWordWrap(True)
            roles_layout.addWidget(role_label)
        
        self.main_layout.addLayout(roles_layout)
        
        # Store the original user data for filtering
        self.all_users = []
        
        # Load users
        self.load_users()
    
    def load_users(self):
        """Load user list from auth manager"""
        if not self.auth_manager:
            return
            
        users = self.auth_manager.get_all_users()
        self.all_users = users  # Store for filtering
        
        if not users:
            self.user_table.setRowCount(0)
            self.user_count_label.setText("0 users")
            return
        
        # Update the filter based on current settings
        self.filter_users()
    
    def filter_users(self):
        """Filter the user list based on search text and role filter"""
        if not self.all_users:
            return
            
        search_text = self.search_input.text().lower()
        role_filter = self.role_filter.currentText()
        
        try:
            filtered_users = []
            for user in self.all_users:
                # Check if user matches search text
                if search_text:
                    username = user.get('username', '').lower()
                    full_name = user.get('full_name', '').lower()
                    email = user.get('email', '').lower()
                    
                    if not (search_text in username or search_text in full_name or search_text in email):
                        continue
                
                # Check if user matches role filter
                if role_filter != "All Roles" and user.get('role') != role_filter:
                    continue
                    
                filtered_users.append(user)
            
            # Update the table with filtered users
            self.update_user_table(filtered_users)
        except Exception as e:
            self.logger.error(f"Error filtering users: {str(e)}")
            # If there's an error, just show all users
            self.update_user_table(self.all_users)
    
    def update_user_table(self, users):
        """Update the user table with the provided users"""
        try:
            self.user_table.setRowCount(len(users))
            
            # Update the user count label
            total_users = len(self.all_users)
            filtered_users = len(users)
            
            if filtered_users == total_users:
                self.user_count_label.setText(f"{total_users} users")
            else:
                self.user_count_label.setText(f"{filtered_users} of {total_users} users")
            
            for row, user in enumerate(users):
                # Username
                self.user_table.setItem(row, 0, QTableWidgetItem(user.get('username', '')))
                
                # Full Name
                self.user_table.setItem(row, 1, QTableWidgetItem(user.get('full_name', '')))
                
                # Email
                self.user_table.setItem(row, 2, QTableWidgetItem(user.get('email', '')))
                
                # Role
                role_item = QTableWidgetItem(user.get('role', ''))
                
                # Color-code by role
                if user.get('role') == UserRole.ADMIN:
                    role_item.setForeground(QColor("#d32f2f"))  # Red for admins
                elif user.get('role') == UserRole.MANAGER:
                    role_item.setForeground(QColor("#1976d2"))  # Blue for managers
                elif user.get('role') == UserRole.CASHIER:
                    role_item.setForeground(QColor("#388e3c"))  # Green for cashiers
                    
                self.user_table.setItem(row, 3, role_item)
                
                # Last Login
                last_login = user.get('last_login', '')
                if last_login:
                    # Format the date nicely
                    try:
                        login_date = datetime.datetime.fromisoformat(last_login)
                        formatted_date = login_date.strftime("%Y-%m-%d %H:%M")
                        last_login_item = QTableWidgetItem(formatted_date)
                    except (ValueError, TypeError):
                        last_login_item = QTableWidgetItem(str(last_login))
                else:
                    last_login_item = QTableWidgetItem("Never")
                    
                self.user_table.setItem(row, 4, last_login_item)
                
                # Actions
                action_widget = QWidget()
                action_layout = QHBoxLayout(action_widget)
                action_layout.setContentsMargins(2, 2, 2, 2)
                action_layout.setSpacing(4)
                
                # Edit button
                edit_btn = QPushButton("Edit")
                edit_btn.setStyleSheet("QPushButton { background-color: #2196F3; color: white; }")
                edit_btn.clicked.connect(lambda checked, u=user: self.edit_user(u))
                
                # Delete button
                delete_btn = QPushButton("Delete")
                delete_btn.setStyleSheet("QPushButton { background-color: #F44336; color: white; }")
                delete_btn.clicked.connect(lambda checked, u=user: self.delete_user(u))
                
                # More options button
                more_btn = QToolButton()
                more_btn.setText("⋮")
                more_btn.setPopupMode(QToolButton.ToolButtonPopupMode.InstantPopup)
                
                # Create menu for more options
                menu = QMenu(more_btn)
                
                # Reset password action
                reset_password_action = menu.addAction("Reset Password")
                reset_password_action.triggered.connect(lambda checked, u=user: self.reset_user_password(u))
                
                # Manage permissions action
                permissions_action = menu.addAction("Permissions")
                permissions_action.triggered.connect(lambda checked, u=user: self.manage_user_permissions(u))
                
                more_btn.setMenu(menu)
                
                # Check if this is the current user
                current_user = self.auth_manager.get_current_user()
                if current_user and user.get('username') == current_user.username:
                    delete_btn.setEnabled(False)  # Can't delete yourself
                
                action_layout.addWidget(edit_btn)
                action_layout.addWidget(delete_btn)
                action_layout.addWidget(more_btn)
                action_layout.addStretch()
                
                self.user_table.setCellWidget(row, 5, action_widget)
        except Exception as e:
            self.logger.error(f"Error updating user table: {str(e)}")
            # Show error message in the table
            self.user_table.setRowCount(1)
            self.user_table.setItem(0, 0, QTableWidgetItem("Error loading users"))
            self.user_count_label.setText("Error loading users")
    
    def add_user(self):
        """Show dialog to add a new user"""
        from ui.views.settings import UserDialog
        
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
        from ui.views.settings import UserDialog
        
        dialog = UserDialog(self, user)
        result = dialog.exec()
        
        if result == QDialog.DialogCode.Accepted:
            user_data = dialog.get_user_data()
            
            # Prepare the updated user data
            updated_data = {
                'user_id': user.get('user_id'),
                'full_name': user_data['full_name'],
                'email': user_data['email'],
                'role': user_data['role']
            }
            
            # Call the auth manager to update the user
            if hasattr(self.auth_manager, 'update_user') and callable(self.auth_manager.update_user):
                success, message = self.auth_manager.update_user(updated_data)
                
                if success:
                    QMessageBox.information(self, "Success", "User updated successfully.")
                    self.load_users()
                else:
                    QMessageBox.warning(self, "Error", f"Failed to update user: {message}")
            else:
                QMessageBox.warning(self, "Not Implemented", 
                                  "The update_user method is not available in the auth manager.")
                self.load_users()
    
    def reset_user_password(self, user):
        """Reset a user's password"""
        username = user.get('username', '')
        
        if not username:
            QMessageBox.warning(self, "Error", "Username not found.")
            return
            
        # Show password reset dialog
        dialog = PasswordResetDialog(self, username)
        result = dialog.exec()
        
        if result == QDialog.DialogCode.Accepted:
            new_password = dialog.get_password()
            
            # Call the auth manager to update the password
            if hasattr(self.auth_manager, 'reset_password') and callable(self.auth_manager.reset_password):
                success, message = self.auth_manager.reset_password(
                    user_id=user.get('user_id'),
                    new_password=new_password,
                    require_change=True  # Require password change on next login
                )
                
                if success:
                    QMessageBox.information(self, "Success", 
                                          "Password has been reset. User will need to change it on next login.")
                else:
                    QMessageBox.warning(self, "Error", f"Failed to reset password: {message}")
            else:
                QMessageBox.warning(self, "Not Implemented", 
                                  "The reset_password method is not available in the auth manager.")
    
    def manage_user_permissions(self, user):
        """Manage a user's permissions"""
        # Show permissions dialog
        dialog = UserPermissionsDialog(self, user)
        result = dialog.exec()
        
        if result == QDialog.DialogCode.Accepted:
            permissions = dialog.get_permissions()
            
            # Call the auth manager to update permissions
            if hasattr(self.auth_manager, 'update_user_permissions') and callable(self.auth_manager.update_user_permissions):
                success, message = self.auth_manager.update_user_permissions(
                    user_id=user.get('user_id'),
                    permissions=permissions
                )
                
                if success:
                    QMessageBox.information(self, "Success", "User permissions updated successfully.")
                else:
                    QMessageBox.warning(self, "Error", f"Failed to update permissions: {message}")
            else:
                QMessageBox.warning(self, "Not Implemented", 
                                  "The update_user_permissions method is not available in the auth manager.")
    
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
    
    def update_view(self):
        """Update the view with fresh data"""
        self.load_users() 