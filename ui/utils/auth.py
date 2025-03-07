import os
import json
import hashlib
import uuid
import datetime
from pathlib import Path
from PyQt6.QtCore import QObject, pyqtSignal, QSettings

from ui.utils.logger import get_logger
from ui.utils.constants import UserRole

class User:
    """User class for authentication and authorization"""
    def __init__(self, username, full_name, role, email=None, user_id=None):
        self.username = username
        self.full_name = full_name
        self.role = role
        self.email = email
        self.user_id = user_id or str(uuid.uuid4())
        self.created_at = datetime.datetime.now().isoformat()
        self.last_login = None

    def to_dict(self):
        """Convert user to dictionary for storage"""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'email': self.email,
            'created_at': self.created_at,
            'last_login': self.last_login
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create user from dictionary"""
        user = cls(
            username=data['username'],
            full_name=data['full_name'],
            role=data['role'],
            email=data.get('email'),
            user_id=data.get('user_id')
        )
        user.created_at = data.get('created_at')
        user.last_login = data.get('last_login')
        return user

class AuthManager(QObject):
    """
    Authentication manager for PyQt application.
    Handles user login, logout, and session management.
    """
    # Signal for auth state changes
    auth_changed = pyqtSignal(bool, object)  # is_authenticated, user_info
    
    def __init__(self):
        super().__init__()
        self.logger = get_logger()
        self.settings = QSettings()
        
        # Track current authenticated user
        self.current_user = None
        
        # Initialize users directory
        self.users_dir = Path("data/users")
        if not self.users_dir.exists():
            os.makedirs(self.users_dir, exist_ok=True)
            self.logger.info(f"Created users directory: {self.users_dir}")
            
            # Create default admin user if no users exist
            self._create_default_admin()
        
        # Check for stored session
        self._load_session()
    
    def _create_default_admin(self):
        """Create default admin user if no users exist"""
        try:
            user_files = list(self.users_dir.glob("*.json"))
            if not user_files:
                self.logger.info("No users found, creating default admin user")
                
                # Create default admin user
                default_admin = User(
                    username="admin",
                    full_name="Administrator",
                    role=UserRole.ADMIN,
                    email="admin@example.com"
                )
                
                # Set password to "admin" (for development only)
                password = "admin"
                hashed_password = self._hash_password(password)
                
                # Save user
                self._save_user(default_admin, hashed_password)
                
                self.logger.info("Default admin user created")
                
                # Add warning about default user
                self.logger.warning("Default admin user created with password 'admin'. Please change this password immediately!")
        except Exception as e:
            self.logger.error(f"Error creating default admin user: {str(e)}")
    
    def _load_session(self):
        """Load user session from settings if available"""
        user_id = self.settings.value("auth/user_id")
        token = self.settings.value("auth/token")
        
        if user_id and token:
            # Load user data
            user_file = self.users_dir / f"{user_id}.json"
            if user_file.exists():
                try:
                    with open(user_file, 'r') as f:
                        data = json.load(f)
                        
                    # Verify token
                    stored_token = data.get('session_token')
                    if stored_token and stored_token == token:
                        self.current_user = User.from_dict(data)
                        self.logger.info(f"Session restored for user: {self.current_user.username}")
                    else:
                        self.logger.warning("Invalid session token, user must login again")
                        self.settings.remove("auth/user_id")
                        self.settings.remove("auth/token")
                except Exception as e:
                    self.logger.error(f"Error loading user session: {str(e)}")
    
    def _hash_password(self, password, salt=None):
        """Hash password with optional salt"""
        if not salt:
            salt = os.urandom(32)  # 32 bytes for the salt
            
        # Use strong hashing algorithm with salting
        key = hashlib.pbkdf2_hmac(
            'sha256',  # Use SHA-256 hash algorithm
            password.encode('utf-8'),  # Convert password to bytes
            salt,  # Salt for the hash
            100000,  # 100,000 iterations of SHA-256
            dklen=128  # Output is 128 bytes
        )
        
        return {
            'salt': salt.hex(),
            'key': key.hex()
        }
    
    def _verify_password(self, stored_hash, password):
        """Verify password against stored hash"""
        # Convert stored salt from hex to bytes
        salt = bytes.fromhex(stored_hash['salt'])
        
        # Hash the provided password with the same salt
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000,
            dklen=128
        )
        
        # Compare the keys
        return key.hex() == stored_hash['key']
    
    def _save_user(self, user, password_hash=None):
        """Save user to file"""
        user_data = user.to_dict()
        
        # Add password hash if provided
        if password_hash:
            user_data['password_hash'] = password_hash
        
        # Save to file
        user_file = self.users_dir / f"{user.user_id}.json"
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=2)
    
    def _generate_session_token(self):
        """Generate a new session token"""
        return str(uuid.uuid4())
    
    def login(self, username, password):
        """Attempt to login user with username and password"""
        try:
            # Find user file by username
            user_files = list(self.users_dir.glob("*.json"))
            for user_file in user_files:
                with open(user_file, 'r') as f:
                    data = json.load(f)
                    
                if data.get('username') == username:
                    # Found user, verify password
                    stored_hash = data.get('password_hash')
                    if stored_hash and self._verify_password(stored_hash, password):
                        # Password verified, create session
                        user = User.from_dict(data)
                        
                        # Create session token
                        token = self._generate_session_token()
                        
                        # Update user data
                        user.last_login = datetime.datetime.now().isoformat()
                        data.update(user.to_dict())
                        data['session_token'] = token
                        
                        # Save updated user data
                        with open(user_file, 'w') as f:
                            json.dump(data, f, indent=2)
                        
                        # Save session in settings
                        self.settings.setValue("auth/user_id", user.user_id)
                        self.settings.setValue("auth/token", token)
                        
                        # Set current user
                        self.current_user = user
                        
                        # Emit signal
                        self.auth_changed.emit(True, user)
                        
                        self.logger.info(f"User logged in: {username}")
                        return True, "Login successful"
                    else:
                        self.logger.warning(f"Invalid password for user: {username}")
                        return False, "Invalid password"
            
            # User not found
            self.logger.warning(f"User not found: {username}")
            return False, "User not found"
        except Exception as e:
            self.logger.error(f"Login error: {str(e)}")
            return False, f"Login error: {str(e)}"
    
    def logout(self):
        """Log out current user"""
        if self.current_user:
            self.logger.info(f"User logged out: {self.current_user.username}")
            
            # Remove session from settings
            self.settings.remove("auth/user_id")
            self.settings.remove("auth/token")
            
            # Remove session token from user file
            user_file = self.users_dir / f"{self.current_user.user_id}.json"
            if user_file.exists():
                try:
                    with open(user_file, 'r') as f:
                        data = json.load(f)
                    
                    if 'session_token' in data:
                        del data['session_token']
                    
                    with open(user_file, 'w') as f:
                        json.dump(data, f, indent=2)
                except Exception as e:
                    self.logger.error(f"Error updating user file: {str(e)}")
            
            # Clear current user
            old_user = self.current_user
            self.current_user = None
            
            # Emit signal
            self.auth_changed.emit(False, None)
            
            return True, "Logout successful"
        
        return False, "No user logged in"
    
    def is_authenticated(self):
        """Check if a user is authenticated"""
        return self.current_user is not None
    
    def get_current_user(self):
        """Get current authenticated user"""
        return self.current_user
    
    def update_password(self, username, old_password, new_password):
        """Update user password"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        # Only allow password change for current user or admin users
        if self.current_user.username != username and self.current_user.role != UserRole.ADMIN:
            return False, "Not authorized to change this user's password"
        
        try:
            # Find user file by username
            user_files = list(self.users_dir.glob("*.json"))
            for user_file in user_files:
                with open(user_file, 'r') as f:
                    data = json.load(f)
                    
                if data.get('username') == username:
                    # Found user, verify old password
                    stored_hash = data.get('password_hash')
                    if stored_hash and self._verify_password(stored_hash, old_password):
                        # Password verified, update password
                        new_hash = self._hash_password(new_password)
                        data['password_hash'] = new_hash
                        
                        # Save updated user data
                        with open(user_file, 'w') as f:
                            json.dump(data, f, indent=2)
                        
                        self.logger.info(f"Password updated for user: {username}")
                        return True, "Password updated successfully"
                    else:
                        self.logger.warning(f"Invalid old password for user: {username}")
                        return False, "Invalid old password"
            
            # User not found
            self.logger.warning(f"User not found: {username}")
            return False, "User not found"
        except Exception as e:
            self.logger.error(f"Update password error: {str(e)}")
            return False, f"Update password error: {str(e)}"
    
    def create_user(self, username, password, full_name, role, email=None):
        """Create a new user"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        # Only allow user creation for admin users
        if self.current_user.role != UserRole.ADMIN:
            return False, "Not authorized to create users"
        
        try:
            # Check if username already exists
            user_files = list(self.users_dir.glob("*.json"))
            for user_file in user_files:
                with open(user_file, 'r') as f:
                    data = json.load(f)
                    
                if data.get('username') == username:
                    self.logger.warning(f"Username already exists: {username}")
                    return False, "Username already exists"
            
            # Create new user
            new_user = User(
                username=username,
                full_name=full_name,
                role=role,
                email=email
            )
            
            # Hash password
            password_hash = self._hash_password(password)
            
            # Save user
            self._save_user(new_user, password_hash)
            
            self.logger.info(f"User created: {username}")
            return True, "User created successfully"
        except Exception as e:
            self.logger.error(f"Create user error: {str(e)}")
            return False, f"Create user error: {str(e)}"
    
    def get_all_users(self):
        """Get list of all users (admin only)"""
        if not self.is_authenticated():
            return None
        
        if self.current_user.role != UserRole.ADMIN:
            return None
        
        try:
            users = []
            user_files = list(self.users_dir.glob("*.json"))
            for user_file in user_files:
                with open(user_file, 'r') as f:
                    data = json.load(f)
                    
                # Remove sensitive data
                if 'password_hash' in data:
                    del data['password_hash']
                if 'session_token' in data:
                    del data['session_token']
                
                users.append(data)
            
            return users
        except Exception as e:
            self.logger.error(f"Get all users error: {str(e)}")
            return None
    
    def delete_user(self, user_id):
        """Delete a user (admin only)"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        if self.current_user.role != UserRole.ADMIN:
            return False, "Not authorized to delete users"
        
        # Can't delete yourself
        if self.current_user.user_id == user_id:
            return False, "Cannot delete your own account"
        
        try:
            user_file = self.users_dir / f"{user_id}.json"
            if user_file.exists():
                # Get username for logging
                with open(user_file, 'r') as f:
                    data = json.load(f)
                    username = data.get('username', 'Unknown')
                
                # Delete user file
                os.remove(user_file)
                self.logger.info(f"User deleted: {username} ({user_id})")
                return True, "User deleted successfully"
            else:
                return False, "User not found"
        except Exception as e:
            self.logger.error(f"Delete user error: {str(e)}")
            return False, f"Delete user error: {str(e)}"
    
    def update_user(self, user_data):
        """Update a user's information"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        # Only allow user updates for admin users or the user themselves
        if self.current_user.role != UserRole.ADMIN and self.current_user.user_id != user_data.get('user_id'):
            return False, "Not authorized to update this user"
        
        # Get user_id
        user_id = user_data.get('user_id')
        if not user_id:
            return False, "User ID is required"
        
        try:
            user_file = self.users_dir / f"{user_id}.json"
            if not user_file.exists():
                return False, "User not found"
            
            # Read existing user data
            with open(user_file, 'r') as f:
                existing_data = json.load(f)
            
            # Update fields (except username and password)
            existing_data['full_name'] = user_data.get('full_name', existing_data.get('full_name', ''))
            existing_data['email'] = user_data.get('email', existing_data.get('email', ''))
            
            # Only admins can change roles
            if self.current_user.role == UserRole.ADMIN:
                existing_data['role'] = user_data.get('role', existing_data.get('role', UserRole.VIEWER))
            
            # Save updated user
            with open(user_file, 'w') as f:
                json.dump(existing_data, f, indent=2)
            
            self.logger.info(f"User updated: {existing_data.get('username')} ({user_id})")
            return True, "User updated successfully"
        except Exception as e:
            self.logger.error(f"Update user error: {str(e)}")
            return False, f"Update user error: {str(e)}"
    
    def reset_password(self, user_id, new_password, require_change=False):
        """Reset a user's password (admin only or user themselves)"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        # Only allow password resets for admin users or the user themselves
        if self.current_user.role != UserRole.ADMIN and self.current_user.user_id != user_id:
            return False, "Not authorized to reset this user's password"
        
        try:
            user_file = self.users_dir / f"{user_id}.json"
            if not user_file.exists():
                return False, "User not found"
            
            # Read existing user data
            with open(user_file, 'r') as f:
                data = json.load(f)
                username = data.get('username', 'Unknown')
            
            # Hash the new password
            password_hash = self._hash_password(new_password)
            
            # Update the password hash
            data['password_hash'] = password_hash
            
            # Set the password change requirement flag if needed
            if require_change:
                data['require_password_change'] = True
            
            # Set password change timestamp
            data['password_changed_at'] = datetime.datetime.now().isoformat()
            
            # Save updated user
            with open(user_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            self.logger.info(f"Password reset for user: {username} ({user_id})")
            return True, "Password reset successfully"
        except Exception as e:
            self.logger.error(f"Password reset error: {str(e)}")
            return False, f"Password reset error: {str(e)}"
    
    def update_user_permissions(self, user_id, permissions):
        """Update a user's custom permissions (admin only)"""
        if not self.is_authenticated():
            return False, "Not authenticated"
        
        if self.current_user.role != UserRole.ADMIN:
            return False, "Not authorized to modify permissions"
        
        try:
            user_file = self.users_dir / f"{user_id}.json"
            if not user_file.exists():
                return False, "User not found"
            
            # Read existing user data
            with open(user_file, 'r') as f:
                data = json.load(f)
                username = data.get('username', 'Unknown')
            
            # Update permissions
            data['permissions'] = permissions
            
            # Save updated user
            with open(user_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            self.logger.info(f"Permissions updated for user: {username} ({user_id})")
            return True, "Permissions updated successfully"
        except Exception as e:
            self.logger.error(f"Update permissions error: {str(e)}")
            return False, f"Update permissions error: {str(e)}"
    
    def has_permission(self, permission):
        """Check if current user has a specific permission"""
        if not self.is_authenticated():
            return False
        
        # Admin has all permissions
        if self.current_user.role == UserRole.ADMIN:
            return True
        
        # Manager has most permissions except user management
        if self.current_user.role == UserRole.MANAGER:
            if permission in ['manage_users', 'delete_users']:
                return False
            return True
        
        # Cashier permissions
        if self.current_user.role == UserRole.CASHIER:
            if permission in ['create_sale', 'view_sales', 'create_payment']:
                return True
            return False
        
        # Clerk permissions
        if self.current_user.role == UserRole.CLERK:
            if permission in ['view_inventory', 'update_inventory']:
                return True
            return False
        
        # Viewer permissions (read-only)
        if self.current_user.role == UserRole.VIEWER:
            if permission.startswith('view_'):
                return True
            return False
        
        return False 