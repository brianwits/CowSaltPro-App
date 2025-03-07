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
            
            # Create production_batches table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS production_batches (
                batch_id TEXT PRIMARY KEY,
                creation_date TEXT NOT NULL,
                completion_date TEXT,
                status TEXT NOT NULL,
                production_quantity REAL NOT NULL,
                notes TEXT
            )
            ''')
            
            # Create batch_ingredients table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS batch_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                ingredient_id TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                FOREIGN KEY (batch_id) REFERENCES production_batches(batch_id)
            )
            ''')
            
            # Create quality_control table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS quality_control (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                test_date TEXT NOT NULL,
                test_type TEXT NOT NULL,
                test_result TEXT NOT NULL,
                pass_fail TEXT NOT NULL,
                notes TEXT,
                tested_by TEXT NOT NULL,
                FOREIGN KEY (batch_id) REFERENCES production_batches(batch_id)
            )
            ''')
            
            # Create formulas table for salt mix formulas
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS formulas (
                formula_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_date TEXT NOT NULL,
                last_modified TEXT NOT NULL,
                version TEXT NOT NULL,
                is_active INTEGER NOT NULL
            )
            ''')
            
            # Create formula_ingredients table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS formula_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                formula_id TEXT NOT NULL,
                ingredient_id TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                FOREIGN KEY (formula_id) REFERENCES formulas(formula_id)
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
    
    def get_production_batches(self):
        """Get all production batches"""
        self.logger.info("Fetching production batches")
        conn = None
        try:
            conn = self._get_connection()
            query = "SELECT * FROM production_batches ORDER BY creation_date DESC"
            df = pd.read_sql_query(query, conn)
            self.logger.info(f"Retrieved {len(df)} production batches")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching production batches: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
    
    def get_batch_details(self, batch_id):
        """Get details for a specific batch including ingredients and quality tests"""
        self.logger.info(f"Fetching details for batch: {batch_id}")
        conn = None
        try:
            conn = self._get_connection()
            
            # Get batch information
            batch_query = "SELECT * FROM production_batches WHERE batch_id = ?"
            batch_df = pd.read_sql_query(batch_query, conn, params=(batch_id,))
            
            # Get ingredients
            ingredients_query = """
                SELECT bi.*, p.name as ingredient_name 
                FROM batch_ingredients bi
                LEFT JOIN products p ON bi.ingredient_id = p.product_id
                WHERE bi.batch_id = ?
            """
            ingredients_df = pd.read_sql_query(ingredients_query, conn, params=(batch_id,))
            
            # Get quality control tests
            qc_query = "SELECT * FROM quality_control WHERE batch_id = ? ORDER BY test_date DESC"
            qc_df = pd.read_sql_query(qc_query, conn, params=(batch_id,))
            
            return {
                "batch": batch_df,
                "ingredients": ingredients_df,
                "quality_tests": qc_df
            }
        except Exception as e:
            self.logger.error(f"Error fetching batch details: {str(e)}", exc_info=True)
            return {"batch": pd.DataFrame(), "ingredients": pd.DataFrame(), "quality_tests": pd.DataFrame()}
        finally:
            if conn:
                conn.close()
    
    def add_production_batch(self, batch_id, creation_date, production_quantity, status="In Progress", notes=None):
        """Add a new production batch"""
        self.logger.info(f"Adding production batch: {batch_id}, quantity: {production_quantity}")
        
        # Input validation
        if not batch_id or not creation_date or production_quantity <= 0:
            error_msg = "Invalid batch data: batch_id, creation_date are required and quantity must be > 0"
            self.logger.error(error_msg)
            raise ValueError(error_msg)
            
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Use parameterized query to prevent SQL injection
            cursor.execute(
                """INSERT INTO production_batches 
                   (batch_id, creation_date, status, production_quantity, notes) 
                   VALUES (?, ?, ?, ?, ?)""",
                (batch_id, creation_date, status, production_quantity, notes)
            )
            
            # Verify that the insert succeeded
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert production batch - no rows affected")
                
            conn.commit()
            self.logger.info(f"Production batch added successfully: {batch_id}")
            self.data_changed.emit("production_batches")
            return True
        except sqlite3.Error as sql_e:
            self.logger.error(f"SQLite error adding batch: {str(sql_e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise Exception(f"Database error: {str(sql_e)}")
        except Exception as e:
            self.logger.error(f"Error adding batch: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def add_batch_ingredient(self, batch_id, ingredient_id, quantity, unit):
        """Add an ingredient to a production batch"""
        self.logger.info(f"Adding ingredient {ingredient_id} to batch {batch_id}")
        
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO batch_ingredients 
                   (batch_id, ingredient_id, quantity, unit) 
                   VALUES (?, ?, ?, ?)""",
                (batch_id, ingredient_id, quantity, unit)
            )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert batch ingredient - no rows affected")
                
            conn.commit()
            self.logger.info(f"Batch ingredient added successfully to batch: {batch_id}")
            self.data_changed.emit("batch_ingredients")
            return True
        except Exception as e:
            self.logger.error(f"Error adding batch ingredient: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def update_batch_status(self, batch_id, status, completion_date=None):
        """Update the status of a production batch"""
        self.logger.info(f"Updating batch {batch_id} status to {status}")
        
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            if status.lower() == "completed" and completion_date:
                cursor.execute(
                    "UPDATE production_batches SET status = ?, completion_date = ? WHERE batch_id = ?",
                    (status, completion_date, batch_id)
                )
            else:
                cursor.execute(
                    "UPDATE production_batches SET status = ? WHERE batch_id = ?",
                    (status, batch_id)
                )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception(f"Failed to update batch status - batch {batch_id} not found")
                
            conn.commit()
            self.logger.info(f"Batch status updated successfully: {batch_id}")
            self.data_changed.emit("production_batches")
            return True
        except Exception as e:
            self.logger.error(f"Error updating batch status: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def add_quality_test(self, batch_id, test_date, test_type, test_result, pass_fail, tested_by, notes=None):
        """Add a quality control test for a production batch"""
        self.logger.info(f"Adding quality test for batch {batch_id}, type: {test_type}")
        
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO quality_control 
                   (batch_id, test_date, test_type, test_result, pass_fail, notes, tested_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (batch_id, test_date, test_type, test_result, pass_fail, notes, tested_by)
            )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert quality test - no rows affected")
                
            conn.commit()
            self.logger.info(f"Quality test added successfully for batch: {batch_id}")
            self.data_changed.emit("quality_control")
            return True
        except Exception as e:
            self.logger.error(f"Error adding quality test: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def get_formulas(self, active_only=True):
        """Get all formulas, optionally filtering for active ones only"""
        self.logger.info("Fetching formulas")
        conn = None
        try:
            conn = self._get_connection()
            query = "SELECT * FROM formulas"
            if active_only:
                query += " WHERE is_active = 1"
            query += " ORDER BY name"
            df = pd.read_sql_query(query, conn)
            self.logger.info(f"Retrieved {len(df)} formulas")
            return df
        except Exception as e:
            self.logger.error(f"Error fetching formulas: {str(e)}", exc_info=True)
            return pd.DataFrame()
        finally:
            if conn:
                conn.close()
    
    def get_formula_details(self, formula_id):
        """Get details for a specific formula including ingredients"""
        self.logger.info(f"Fetching details for formula: {formula_id}")
        conn = None
        try:
            conn = self._get_connection()
            
            # Get formula information
            formula_query = "SELECT * FROM formulas WHERE formula_id = ?"
            formula_df = pd.read_sql_query(formula_query, conn, params=(formula_id,))
            
            # Get ingredients
            ingredients_query = """
                SELECT fi.*, p.name as ingredient_name 
                FROM formula_ingredients fi
                LEFT JOIN products p ON fi.ingredient_id = p.product_id
                WHERE fi.formula_id = ?
            """
            ingredients_df = pd.read_sql_query(ingredients_query, conn, params=(formula_id,))
            
            return {
                "formula": formula_df,
                "ingredients": ingredients_df
            }
        except Exception as e:
            self.logger.error(f"Error fetching formula details: {str(e)}", exc_info=True)
            return {"formula": pd.DataFrame(), "ingredients": pd.DataFrame()}
        finally:
            if conn:
                conn.close()
    
    def add_formula(self, formula_id, name, description, created_date, version="1.0", is_active=1):
        """Add a new formula"""
        self.logger.info(f"Adding formula: {name}, version: {version}")
        
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO formulas 
                   (formula_id, name, description, created_date, last_modified, version, is_active) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (formula_id, name, description, created_date, created_date, version, is_active)
            )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert formula - no rows affected")
                
            conn.commit()
            self.logger.info(f"Formula added successfully: {name}")
            self.data_changed.emit("formulas")
            return True
        except Exception as e:
            self.logger.error(f"Error adding formula: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def add_formula_ingredient(self, formula_id, ingredient_id, quantity, unit):
        """Add an ingredient to a formula"""
        self.logger.info(f"Adding ingredient {ingredient_id} to formula {formula_id}")
        
        conn = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO formula_ingredients 
                   (formula_id, ingredient_id, quantity, unit) 
                   VALUES (?, ?, ?, ?)""",
                (formula_id, ingredient_id, quantity, unit)
            )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                raise Exception("Failed to insert formula ingredient - no rows affected")
                
            conn.commit()
            self.logger.info(f"Formula ingredient added successfully to formula: {formula_id}")
            self.data_changed.emit("formula_ingredients")
            return True
        except Exception as e:
            self.logger.error(f"Error adding formula ingredient: {str(e)}", exc_info=True)
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def close(self):
        """Close any open connections when application exits"""
        self.logger.info("Closing data manager and ensuring all connections are closed")
        # SQLite connections are already closed after each operation
        # This method exists to provide a clean shutdown interface 
        # for the application to call when closing
        return True 