from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTableWidget, QTableWidgetItem, 
    QPushButton, QHeaderView, QMessageBox, QDialog, QFormLayout, QLineEdit, 
    QComboBox, QDialogButtonBox, QCheckBox
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QIcon

from ui.widgets.base_view import BaseView
from ui.utils.constants import UserRole

class UserManagementView(BaseView):
    """User management view for managing system users"""
    def __init__(self, parent=None):
        super().__init__("User Management", parent)
        self.init_ui()
    
    def init_ui(self):
        # Get auth manager from main window (if available)
        main_window = self.parent()
        while main_window and not hasattr(main_window, 'auth_manager'):
            main_window = main_window.parent()
            
        self.auth_manager = main_window.auth_manager if main_window else None
        
        # If auth manager not available, show message
        if not self.auth_manager:
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
            
        # Add description
        description = QLabel(
            "Manage system users. From here, you can add, edit, or delete users and assign roles."
        )
        description.setWordWrap(True)
        self.main_layout.addWidget(description)
        self.main_layout.addSpacing(20)
        
        # User table
        self.add_section_header("Users")
        
        self.user_table = QTableWidget()
        self.user_table.setColumnCount(5)
        self.user_table.setHorizontalHeaderLabels(["Username", "Full Name", "Email", "Role", "Actions"])
        self.user_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.user_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.user_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.user_table.setSelectionMode(QTableWidget.SelectionMode.SingleSelection)
        self.user_table.setAlternatingRowColors(True)
        self.main_layout.addWidget(self.user_table)
        
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
        
        # Load users
        self.load_users()
    
    def load_users(self):
        """Load user list from auth manager"""
        if not self.auth_manager:
            return
            
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
            
            current_user = self.auth_manager.get_current_user()
            if current_user and user.get('username') == current_user.username:
                delete_btn.setEnabled(False)  # Can't delete yourself
            
            action_layout.addWidget(edit_btn)
            action_layout.addWidget(delete_btn)
            action_layout.addStretch()
            
            self.user_table.setCellWidget(row, 4, action_widget)
    
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
    
    def update_view(self):
        """Update the view with fresh data"""
        self.load_users() 