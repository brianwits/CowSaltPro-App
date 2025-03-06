import os
import pandas as pd
import sqlite3
import traceback
from PyQt6.QtCore import QObject, pyqtSignal

from ui.utils.logger import get_logger

class DataManager(QObject):
    """
    Data manager class for handling database operations.
    This is a PyQt-optimized version of the original DataManager.
    """
    data_changed = pyqtSignal(str)  # Signal emitted when data changes
    
    def __init__(self):
        super().__init__()
        self.data_dir = "data"
        self.logger = get_logger()
        
        # Ensure data directory exists
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            self.logger.info(f"Created data directory: {self.data_dir}")
            
        # Initialize database
        self.db_path = os.path.join(self.data_dir, "cowsalt.db")
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database with required tables if they don't exist"""
        self.logger.info("Initializing database")
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create products table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                product_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                reorder_level INTEGER NOT NULL
            )
            ''')
            
            # Create inventory table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                last_updated TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            )
            ''')
            
            # Create transactions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                transaction_type TEXT NOT NULL,
                category TEXT NOT NULL
            )
            ''')
            
            # Create payments table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                customer TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_method TEXT NOT NULL,
                reference TEXT
            )
            ''')
            
            conn.commit()
            self.logger.info("Database initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize database: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()
                
    def _get_connection(self):
        """Get a database connection with error handling"""
        try:
            return sqlite3.connect(self.db_path)
        except Exception as e:
            self.logger.error(f"Failed to connect to database: {str(e)}", exc_info=True)
            raise
        
    def get_products(self):
        """Get all products"""
        self.logger.debug("Fetching products")
        conn = None
        try:
            conn = self._get_connection()
            df = pd.read_sql_query("SELECT * FROM products", conn)
            self.logger.debug(f"Retrieved {len(df)} products")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching products: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
        
    def get_inventory(self):
        """Get current inventory"""
        self.logger.debug("Fetching inventory")
        conn = None
        try:
            conn = self._get_connection()
            df = pd.read_sql_query("SELECT * FROM inventory", conn)
            self.logger.debug(f"Retrieved {len(df)} inventory items")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching inventory: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
        
    def get_transactions(self):
        """Get all transactions"""
        self.logger.debug("Fetching transactions")
        conn = None
        try:
            conn = self._get_connection()
            df = pd.read_sql_query("SELECT * FROM transactions", conn)
            self.logger.debug(f"Retrieved {len(df)} transactions")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching transactions: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
        
    def get_payments(self):
        """Get all payments"""
        self.logger.debug("Fetching payments")
        conn = None
        try:
            conn = self._get_connection()
            df = pd.read_sql_query("SELECT * FROM payments", conn)
            self.logger.debug(f"Retrieved {len(df)} payments")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching payments: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
        
    def add_product(self, product_id, name, price, reorder_level):
        """Add a new product"""
        self.logger.info(f"Adding product: {name} (ID: {product_id})")
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO products (product_id, name, price, reorder_level) VALUES (?, ?, ?, ?)",
                (product_id, name, price, reorder_level)
            )
            conn.commit()
            self.logger.info(f"Product added successfully: {name}")
            self.data_changed.emit("products")
        except Exception as e:
            self.logger.error(f"Error adding product: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
        
    def update_inventory(self, product_id, quantity, last_updated):
        """Update inventory for a product"""
        self.logger.info(f"Updating inventory for product ID: {product_id}, quantity: {quantity}")
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Check if product exists in inventory
            cursor.execute("SELECT * FROM inventory WHERE product_id = ?", (product_id,))
            if cursor.fetchone():
                cursor.execute(
                    "UPDATE inventory SET quantity = ?, last_updated = ? WHERE product_id = ?",
                    (quantity, last_updated, product_id)
                )
                self.logger.info(f"Updated inventory for product ID: {product_id}")
            else:
                cursor.execute(
                    "INSERT INTO inventory (product_id, quantity, last_updated) VALUES (?, ?, ?)",
                    (product_id, quantity, last_updated)
                )
                self.logger.info(f"Added new inventory entry for product ID: {product_id}")
                
            conn.commit()
            self.data_changed.emit("inventory")
        except Exception as e:
            self.logger.error(f"Error updating inventory: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
        
    def add_transaction(self, date, description, amount, transaction_type, category):
        """Add a new transaction"""
        self.logger.info(f"Adding transaction: {description}, amount: {amount}, type: {transaction_type}")
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transactions (date, description, amount, transaction_type, category) VALUES (?, ?, ?, ?, ?)",
                (date, description, amount, transaction_type, category)
            )
            conn.commit()
            self.logger.info(f"Transaction added successfully: {description}")
            self.data_changed.emit("transactions")
        except Exception as e:
            self.logger.error(f"Error adding transaction: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
        
    def add_payment(self, date, customer, amount, payment_method, reference=None):
        """Add a new payment"""
        self.logger.info(f"Adding payment: {customer}, amount: {amount}, method: {payment_method}")
        
        # Input validation
        if not date or not customer or amount <= 0 or not payment_method:
            error_msg = "Invalid payment data: All fields except reference are required and amount must be > 0"
            self.logger.error(error_msg)
            raise ValueError(error_msg)
            
        conn = None
        try:
            # Get connection with timeout to prevent hanging
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Use parameterized query to prevent SQL injection
            cursor.execute(
                "INSERT INTO payments (date, customer, amount, payment_method, reference) VALUES (?, ?, ?, ?, ?)",
                (date, customer, amount, payment_method, reference)
            )
            
            # Verify that the insert succeeded
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert payment record - no rows affected")
                
            conn.commit()
            self.logger.info(f"Payment added successfully for customer: {customer}")
            self.data_changed.emit("payments")
        except sqlite3.Error as sql_e:
            self.logger.error(f"SQLite error adding payment: {str(sql_e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise Exception(f"Database error: {str(sql_e)}")
        except Exception as e:
            self.logger.error(f"Error adding payment: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close() 