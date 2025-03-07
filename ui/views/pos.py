from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QTableWidget, QTableWidgetItem,
    QHeaderView, QLineEdit, QComboBox, QFrame, QSplitter, QToolBar, QSpinBox, QDialog,
    QDialogButtonBox, QFormLayout, QMessageBox, QTabWidget, QGroupBox, QScrollArea, QSizePolicy,
    QGridLayout, QToolButton, QToolTip
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QTimer
from PyQt6.QtGui import QFont, QIcon, QColor, QPixmap, QCursor

from ui.widgets.base_view import BaseView
from ui.utils.logger import get_logger
from ui.utils.constants import DEFAULT_CURRENCY_SYMBOL
import datetime
import string


class ProductSelector(QWidget):
    """Widget for selecting products to add to the sales cart"""
    
    product_selected = pyqtSignal(dict)  # Signal when a product is selected
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.logger = get_logger()
        self.init_ui()
        self.load_sample_products()  # For demo purposes
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Search bar
        search_layout = QHBoxLayout()
        search_label = QLabel("Search Products:")
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Enter product name or scan barcode...")
        self.search_input.textChanged.connect(self.filter_products)
        
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.search_input)
        layout.addLayout(search_layout)
        
        # Product category filter
        category_layout = QHBoxLayout()
        category_label = QLabel("Category:")
        self.category_combo = QComboBox()
        self.category_combo.addItem("All Categories")
        self.category_combo.addItems(["Salt Products", "Feed Supplements", "Minerals", "Accessories"])
        self.category_combo.currentTextChanged.connect(self.filter_products)
        
        category_layout.addWidget(category_label)
        category_layout.addWidget(self.category_combo)
        category_layout.addStretch()
        layout.addLayout(category_layout)
        
        # Product grid
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_widget = QWidget()
        self.product_grid = QGridLayout(scroll_widget)
        self.product_grid.setAlignment(Qt.AlignmentFlag.AlignTop)
        scroll_area.setWidget(scroll_widget)
        
        layout.addWidget(scroll_area)
    
    def create_product_button(self, product):
        """Create a button for a product in the grid"""
        button = QToolButton()
        button.setText(f"{product['name']}\n{DEFAULT_CURRENCY_SYMBOL} {product['price']:.2f}")
        button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextUnderIcon)
        
        # Set icon based on category (would use actual product images in a real app)
        icon = QIcon("Resources/icons/inventory.png")
        button.setIcon(icon)
        button.setIconSize(QSize(64, 64))
        
        # Set fixed size for grid layout
        button.setMinimumSize(120, 120)
        button.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
        
        # Style based on stock status
        if product['stock'] <= 0:
            button.setEnabled(False)
            button.setStyleSheet("""
                QToolButton {
                    border: 1px solid #d1d1d1;
                    border-radius: 4px;
                    padding: 8px;
                    background-color: #f5f5f5;
                    color: #999999;
                    text-align: center;
                }
            """)
        else:
            button.setStyleSheet("""
                QToolButton {
                    border: 1px solid #d1d1d1;
                    border-radius: 4px;
                    padding: 8px;
                    background-color: white;
                    color: #333333;
                    text-align: center;
                }
                QToolButton:hover {
                    background-color: #e0f2f1;
                    border: 1px solid #4db6ac;
                }
                QToolButton:pressed {
                    background-color: #b2dfdb;
                }
            """)
        
        # Connect to signal
        button.clicked.connect(lambda: self.product_selected.emit(product))
        
        return button
    
    def load_sample_products(self):
        """Load sample products for the demo"""
        # In a real application, this would fetch from the database
        self.all_products = [
            {"id": 1, "name": "Cattle Salt Block", "price": 550.0, "category": "Salt Products", "stock": 25},
            {"id": 2, "name": "Mineral Salt Lick", "price": 780.0, "category": "Salt Products", "stock": 15},
            {"id": 3, "name": "Salt Holder", "price": 350.0, "category": "Accessories", "stock": 10},
            {"id": 4, "name": "Mineral Supplement", "price": 950.0, "category": "Feed Supplements", "stock": 8},
            {"id": 5, "name": "Copper Supplement", "price": 1200.0, "category": "Minerals", "stock": 5},
            {"id": 6, "name": "Zinc Supplement", "price": 850.0, "category": "Minerals", "stock": 12},
            {"id": 7, "name": "Salt Crusher", "price": 2500.0, "category": "Accessories", "stock": 3},
            {"id": 8, "name": "Calcium Block", "price": 650.0, "category": "Minerals", "stock": 0},
            {"id": 9, "name": "Feeding Trough", "price": 1800.0, "category": "Accessories", "stock": 7},
            {"id": 10, "name": "Multi-vitamin Pack", "price": 1500.0, "category": "Feed Supplements", "stock": 9},
            {"id": 11, "name": "Plain Salt - 5kg", "price": 250.0, "category": "Salt Products", "stock": 30},
            {"id": 12, "name": "Plain Salt - 10kg", "price": 450.0, "category": "Salt Products", "stock": 20},
        ]
        
        # Display all products initially
        self.display_products(self.all_products)
    
    def display_products(self, products):
        """Display products in the grid"""
        # Clear existing products
        for i in reversed(range(self.product_grid.count())):
            self.product_grid.itemAt(i).widget().setParent(None)
        
        # Add products to grid
        row, col = 0, 0
        max_cols = 3  # Number of columns in the grid
        
        for product in products:
            button = self.create_product_button(product)
            self.product_grid.addWidget(button, row, col)
            
            col += 1
            if col >= max_cols:
                col = 0
                row += 1
    
    def filter_products(self):
        """Filter products based on search text and category"""
        search_text = self.search_input.text().lower()
        selected_category = self.category_combo.currentText()
        
        filtered_products = []
        for product in self.all_products:
            # Filter by search text
            if search_text and search_text not in product['name'].lower():
                continue
            
            # Filter by category
            if selected_category != "All Categories" and product['category'] != selected_category:
                continue
            
            filtered_products.append(product)
        
        self.display_products(filtered_products)


class CustomerSelector(QWidget):
    """Widget for selecting a customer for the sale"""
    
    customer_selected = pyqtSignal(dict)  # Signal when a customer is selected
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.logger = get_logger()
        self.init_ui()
        self.load_sample_customers()  # For demo purposes
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Customer search
        search_layout = QHBoxLayout()
        search_label = QLabel("Customer:")
        self.customer_combo = QComboBox()
        self.customer_combo.setEditable(True)
        self.customer_combo.setInsertPolicy(QComboBox.InsertPolicy.NoInsert)
        self.customer_combo.lineEdit().setPlaceholderText("Search or select customer...")
        self.customer_combo.currentIndexChanged.connect(self.on_customer_selected)
        
        add_customer_btn = QPushButton("Add New")
        add_customer_btn.clicked.connect(self.add_new_customer)
        
        search_layout.addWidget(search_label)
        search_layout.addWidget(self.customer_combo, 1)
        search_layout.addWidget(add_customer_btn)
        
        layout.addLayout(search_layout)
    
    def load_sample_customers(self):
        """Load sample customers for demo"""
        # In a real app, this would fetch from database
        self.customers = [
            {"id": 1, "name": "John Doe", "phone": "0712345678", "email": "john@example.com"},
            {"id": 2, "name": "Jane Smith", "phone": "0723456789", "email": "jane@example.com"},
            {"id": 3, "name": "Bob Johnson", "phone": "0734567890", "email": "bob@example.com"},
            {"id": 4, "name": "Alice Brown", "phone": "0745678901", "email": "alice@example.com"},
            {"id": 5, "name": "David Wilson", "phone": "0756789012", "email": "david@example.com"},
        ]
        
        # Add customers to combo box
        self.customer_combo.clear()
        self.customer_combo.addItem("Walk-in Customer", {"id": 0, "name": "Walk-in Customer"})
        
        for customer in self.customers:
            display_text = f"{customer['name']} - {customer['phone']}"
            self.customer_combo.addItem(display_text, customer)
    
    def on_customer_selected(self, index):
        """Handle customer selection"""
        if index >= 0:
            customer_data = self.customer_combo.currentData()
            self.customer_selected.emit(customer_data)
    
    def add_new_customer(self):
        """Show dialog to add a new customer"""
        dialog = QDialog(self)
        dialog.setWindowTitle("Add New Customer")
        dialog.setMinimumWidth(400)
        
        layout = QVBoxLayout(dialog)
        
        # Form for customer details
        form_layout = QFormLayout()
        
        name_input = QLineEdit()
        form_layout.addRow("Name:", name_input)
        
        phone_input = QLineEdit()
        phone_input.setPlaceholderText("e.g. 0712345678")
        form_layout.addRow("Phone:", phone_input)
        
        email_input = QLineEdit()
        email_input.setPlaceholderText("e.g. customer@example.com")
        form_layout.addRow("Email:", email_input)
        
        layout.addLayout(form_layout)
        
        # Buttons
        button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        button_box.accepted.connect(dialog.accept)
        button_box.rejected.connect(dialog.reject)
        layout.addWidget(button_box)
        
        # Show dialog
        if dialog.exec() == QDialog.DialogCode.Accepted:
            # Generate a new ID (in a real app, this would be done by the database)
            new_id = max(c["id"] for c in self.customers) + 1
            
            # Create new customer
            new_customer = {
                "id": new_id,
                "name": name_input.text(),
                "phone": phone_input.text(),
                "email": email_input.text()
            }
            
            # Add to list and combo box
            self.customers.append(new_customer)
            display_text = f"{new_customer['name']} - {new_customer['phone']}"
            self.customer_combo.addItem(display_text, new_customer)
            
            # Select new customer
            self.customer_combo.setCurrentIndex(self.customer_combo.count() - 1)
            
            QMessageBox.information(self, "Success", "Customer added successfully.")


class SalesCart(QWidget):
    """Widget for managing the sales cart"""
    
    cart_updated = pyqtSignal()  # Signal when cart is updated
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.logger = get_logger()
        self.cart_items = []
        self.customer = {"id": 0, "name": "Walk-in Customer"}
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Cart table
        self.cart_table = QTableWidget()
        self.cart_table.setColumnCount(5)
        self.cart_table.setHorizontalHeaderLabels(["Product", "Price", "Qty", "Total", "Actions"])
        self.cart_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.cart_table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.Fixed)
        self.cart_table.setColumnWidth(4, 100)
        self.cart_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.cart_table.setAlternatingRowColors(True)
        layout.addWidget(self.cart_table)
        
        # Cart Summary
        summary_frame = QFrame()
        summary_frame.setFrameShape(QFrame.Shape.StyledPanel)
        summary_frame.setStyleSheet("background-color: #f9f9f9; padding: 8px;")
        summary_layout = QFormLayout(summary_frame)
        
        self.subtotal_label = QLabel("0.00")
        self.discount_label = QLabel("0.00")
        self.total_label = QLabel("0.00")
        self.total_label.setStyleSheet("font-weight: bold; font-size: 16px; color: #2196F3;")
        
        summary_layout.addRow("Subtotal:", self.subtotal_label)
        summary_layout.addRow("Discount:", self.discount_label)
        summary_layout.addRow("Total:", self.total_label)
        
        layout.addWidget(summary_frame)
        
        # Payment options
        payment_group = QGroupBox("Payment Options")
        payment_layout = QFormLayout(payment_group)
        
        self.payment_method = QComboBox()
        self.payment_method.addItems(["Cash", "M-Pesa", "Card", "Bank Transfer"])
        
        self.payment_status = QComboBox()
        self.payment_status.addItems(["Paid", "Pending", "Partially Paid"])
        
        payment_layout.addRow("Payment Method:", self.payment_method)
        payment_layout.addRow("Payment Status:", self.payment_status)
        
        layout.addWidget(payment_group)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        self.clear_btn = QPushButton("Clear Cart")
        self.clear_btn.setStyleSheet("background-color: #f44336; color: white;")
        self.clear_btn.clicked.connect(self.clear_cart)
        
        self.checkout_btn = QPushButton("Checkout")
        self.checkout_btn.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold;")
        self.checkout_btn.clicked.connect(self.checkout)
        self.checkout_btn.setEnabled(False)  # Disabled until items are added
        
        button_layout.addWidget(self.clear_btn)
        button_layout.addWidget(self.checkout_btn)
        
        layout.addLayout(button_layout)
    
    def add_item(self, product):
        """Add a product to the cart"""
        # Check if product is already in cart
        for item in self.cart_items:
            if item["product"]["id"] == product["id"]:
                # Increment quantity
                item["quantity"] += 1
                self.update_cart_display()
                return
        
        # Add new item to cart
        cart_item = {
            "product": product,
            "quantity": 1,
            "discount": 0
        }
        self.cart_items.append(cart_item)
        
        # Update display
        self.update_cart_display()
    
    def update_cart_display(self):
        """Update the cart table and summary"""
        self.cart_table.setRowCount(len(self.cart_items))
        
        for row, item in enumerate(self.cart_items):
            product = item["product"]
            
            # Product name
            self.cart_table.setItem(row, 0, QTableWidgetItem(product["name"]))
            
            # Price
            price_item = QTableWidgetItem(f"{DEFAULT_CURRENCY_SYMBOL} {product['price']:.2f}")
            price_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            self.cart_table.setItem(row, 1, price_item)
            
            # Quantity
            qty_widget = QWidget()
            qty_layout = QHBoxLayout(qty_widget)
            qty_layout.setContentsMargins(0, 0, 0, 0)
            
            decrease_btn = QPushButton("-")
            decrease_btn.setFixedSize(25, 25)
            decrease_btn.clicked.connect(lambda checked, r=row: self.change_quantity(r, -1))
            
            qty_label = QLabel(str(item["quantity"]))
            qty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            
            increase_btn = QPushButton("+")
            increase_btn.setFixedSize(25, 25)
            increase_btn.clicked.connect(lambda checked, r=row: self.change_quantity(r, 1))
            
            qty_layout.addWidget(decrease_btn)
            qty_layout.addWidget(qty_label)
            qty_layout.addWidget(increase_btn)
            
            self.cart_table.setCellWidget(row, 2, qty_widget)
            
            # Total
            item_total = product["price"] * item["quantity"] - item["discount"]
            total_item = QTableWidgetItem(f"{DEFAULT_CURRENCY_SYMBOL} {item_total:.2f}")
            total_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            self.cart_table.setItem(row, 3, total_item)
            
            # Actions
            actions_widget = QWidget()
            actions_layout = QHBoxLayout(actions_widget)
            actions_layout.setContentsMargins(0, 0, 0, 0)
            
            discount_btn = QPushButton("Disc")
            discount_btn.setFixedSize(40, 25)
            discount_btn.clicked.connect(lambda checked, r=row: self.apply_discount(r))
            
            remove_btn = QPushButton("🗑️")
            remove_btn.setFixedSize(30, 25)
            remove_btn.clicked.connect(lambda checked, r=row: self.remove_item(r))
            
            actions_layout.addWidget(discount_btn)
            actions_layout.addWidget(remove_btn)
            
            self.cart_table.setCellWidget(row, 4, actions_widget)
        
        # Update summary
        self.update_summary()
        
        # Enable/disable checkout button
        self.checkout_btn.setEnabled(len(self.cart_items) > 0)
        
        # Emit signal
        self.cart_updated.emit()
    
    def change_quantity(self, row, delta):
        """Change quantity of an item in the cart"""
        if 0 <= row < len(self.cart_items):
            # Ensure quantity doesn't go below 1
            new_quantity = max(1, self.cart_items[row]["quantity"] + delta)
            
            # Check stock limit
            product_stock = self.cart_items[row]["product"]["stock"]
            if new_quantity > product_stock:
                QMessageBox.warning(self, "Stock Limit", f"Cannot exceed available stock ({product_stock}).")
                return
            
            self.cart_items[row]["quantity"] = new_quantity
            self.update_cart_display()
    
    def apply_discount(self, row):
        """Apply a discount to an item"""
        if 0 <= row < len(self.cart_items):
            item = self.cart_items[row]
            product = item["product"]
            
            dialog = QDialog(self)
            dialog.setWindowTitle("Apply Discount")
            dialog.setMinimumWidth(300)
            
            layout = QVBoxLayout(dialog)
            
            # Form for discount
            form_layout = QFormLayout()
            
            # Calculate maximum discount (item total)
            item_total = product["price"] * item["quantity"]
            
            discount_input = QLineEdit()
            discount_input.setText(str(item["discount"]))
            discount_input.setPlaceholderText(f"Max: {item_total:.2f}")
            form_layout.addRow(f"Discount for {product['name']}:", discount_input)
            
            layout.addLayout(form_layout)
            
            # Buttons
            button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Apply | QDialogButtonBox.StandardButton.Cancel)
            button_box.accepted.connect(dialog.accept)
            button_box.rejected.connect(dialog.reject)
            layout.addWidget(button_box)
            
            # Show dialog
            if dialog.exec() == QDialog.DialogCode.Accepted:
                try:
                    discount = float(discount_input.text())
                    
                    # Validate discount
                    if discount < 0:
                        QMessageBox.warning(self, "Invalid Discount", "Discount cannot be negative.")
                        return
                    
                    if discount > item_total:
                        QMessageBox.warning(self, "Invalid Discount", "Discount cannot exceed item total.")
                        return
                    
                    # Apply discount
                    self.cart_items[row]["discount"] = discount
                    self.update_cart_display()
                    
                except ValueError:
                    QMessageBox.warning(self, "Invalid Input", "Please enter a valid number.")
    
    def remove_item(self, row):
        """Remove an item from the cart"""
        if 0 <= row < len(self.cart_items):
            del self.cart_items[row]
            self.update_cart_display()
    
    def clear_cart(self):
        """Clear all items from the cart"""
        if not self.cart_items:
            return
            
        confirm = QMessageBox.question(
            self,
            "Clear Cart",
            "Are you sure you want to clear the cart?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if confirm == QMessageBox.StandardButton.Yes:
            self.cart_items = []
            self.update_cart_display()
    
    def set_customer(self, customer):
        """Set the customer for this sale"""
        self.customer = customer
    
    def update_summary(self):
        """Update cart summary"""
        subtotal = sum(item["product"]["price"] * item["quantity"] for item in self.cart_items)
        discount = sum(item["discount"] for item in self.cart_items)
        total = subtotal - discount
        
        self.subtotal_label.setText(f"{DEFAULT_CURRENCY_SYMBOL} {subtotal:.2f}")
        self.discount_label.setText(f"{DEFAULT_CURRENCY_SYMBOL} {discount:.2f}")
        self.total_label.setText(f"{DEFAULT_CURRENCY_SYMBOL} {total:.2f}")
    
    def checkout(self):
        """Process the sale checkout"""
        if not self.cart_items:
            QMessageBox.warning(self, "Empty Cart", "Please add items to the cart first.")
            return
        
        # Prepare receipt data
        receipt_data = {
            "customer": self.customer,
            "items": self.cart_items,
            "payment_method": self.payment_method.currentText(),
            "payment_status": self.payment_status.currentText(),
            "timestamp": datetime.datetime.now(),
            "subtotal": sum(item["product"]["price"] * item["quantity"] for item in self.cart_items),
            "discount": sum(item["discount"] for item in self.cart_items)
        }
        receipt_data["total"] = receipt_data["subtotal"] - receipt_data["discount"]
        
        # Show receipt dialog
        dialog = QDialog(self)
        dialog.setWindowTitle("Sales Receipt")
        dialog.setMinimumWidth(400)
        
        layout = QVBoxLayout(dialog)
        
        # Receipt header
        header_label = QLabel("COWSALT PRO RECEIPT")
        header_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        header_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        layout.addWidget(header_label)
        
        date_label = QLabel(receipt_data["timestamp"].strftime("%Y-%m-%d %H:%M:%S"))
        date_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(date_label)
        
        customer_label = QLabel(f"Customer: {receipt_data['customer']['name']}")
        customer_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(customer_label)
        
        layout.addWidget(QLabel(""))  # Spacer
        
        # Items
        for item in receipt_data["items"]:
            item_widget = QWidget()
            item_layout = QHBoxLayout(item_widget)
            
            prod_label = QLabel(f"{item['product']['name']} x {item['quantity']}")
            price_label = QLabel(f"{DEFAULT_CURRENCY_SYMBOL} {item['product']['price'] * item['quantity']:.2f}")
            
            item_layout.addWidget(prod_label)
            item_layout.addStretch()
            item_layout.addWidget(price_label)
            
            layout.addWidget(item_widget)
            
            # Add discount if any
            if item["discount"] > 0:
                disc_widget = QWidget()
                disc_layout = QHBoxLayout(disc_widget)
                disc_layout.setContentsMargins(20, 0, 0, 0)
                
                disc_label = QLabel(f"Discount")
                disc_amount = QLabel(f"- {DEFAULT_CURRENCY_SYMBOL} {item['discount']:.2f}")
                disc_amount.setStyleSheet("color: #F44336;")
                
                disc_layout.addWidget(disc_label)
                disc_layout.addStretch()
                disc_layout.addWidget(disc_amount)
                
                layout.addWidget(disc_widget)
        
        # Separator
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        layout.addWidget(separator)
        
        # Totals
        subtotal_widget = QWidget()
        subtotal_layout = QHBoxLayout(subtotal_widget)
        subtotal_label = QLabel("Subtotal:")
        subtotal_amount = QLabel(f"{DEFAULT_CURRENCY_SYMBOL} {receipt_data['subtotal']:.2f}")
        subtotal_layout.addWidget(subtotal_label)
        subtotal_layout.addStretch()
        subtotal_layout.addWidget(subtotal_amount)
        layout.addWidget(subtotal_widget)
        
        discount_widget = QWidget()
        discount_layout = QHBoxLayout(discount_widget)
        discount_label = QLabel("Total Discount:")
        discount_amount = QLabel(f"{DEFAULT_CURRENCY_SYMBOL} {receipt_data['discount']:.2f}")
        discount_layout.addWidget(discount_label)
        discount_layout.addStretch()
        discount_layout.addWidget(discount_amount)
        layout.addWidget(discount_widget)
        
        total_widget = QWidget()
        total_layout = QHBoxLayout(total_widget)
        total_label = QLabel("TOTAL:")
        total_label.setStyleSheet("font-weight: bold;")
        total_amount = QLabel(f"{DEFAULT_CURRENCY_SYMBOL} {receipt_data['total']:.2f}")
        total_amount.setStyleSheet("font-weight: bold;")
        total_layout.addWidget(total_label)
        total_layout.addStretch()
        total_layout.addWidget(total_amount)
        layout.addWidget(total_widget)
        
        # Payment info
        payment_label = QLabel(f"Payment Method: {receipt_data['payment_method']}")
        layout.addWidget(payment_label)
        
        status_label = QLabel(f"Payment Status: {receipt_data['payment_status']}")
        layout.addWidget(status_label)
        
        # Thank you message
        thanks_label = QLabel("Thank you for your business!")
        thanks_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        thanks_label.setStyleSheet("margin-top: 10px;")
        layout.addWidget(thanks_label)
        
        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | 
            QDialogButtonBox.StandardButton.Save | 
            QDialogButtonBox.StandardButton.Print
        )
        save_button = button_box.button(QDialogButtonBox.StandardButton.Save)
        save_button.setText("Save Receipt")
        
        print_button = button_box.button(QDialogButtonBox.StandardButton.Print)
        print_button.setText("Print Receipt")
        
        ok_button = button_box.button(QDialogButtonBox.StandardButton.Ok)
        ok_button.setText("Complete Sale")
        
        button_box.accepted.connect(dialog.accept)
        save_button.clicked.connect(lambda: self.save_receipt(receipt_data))
        print_button.clicked.connect(lambda: self.print_receipt(receipt_data))
        
        layout.addWidget(button_box)
        
        # Show dialog
        if dialog.exec() == QDialog.DialogCode.Accepted:
            # In a real app, this would save the sale to the database
            self.logger.info(f"Sale completed: {len(receipt_data['items'])} items, "
                            f"total: {DEFAULT_CURRENCY_SYMBOL} {receipt_data['total']:.2f}")
            
            # Clear cart
            self.cart_items = []
            self.update_cart_display()
            
            QMessageBox.information(self, "Success", "Sale completed successfully.")
    
    def save_receipt(self, receipt_data):
        """Save receipt to file (placeholder)"""
        QMessageBox.information(self, "Save Receipt", 
                              "This would save the receipt to a file in a real application.")
    
    def print_receipt(self, receipt_data):
        """Print receipt (placeholder)"""
        QMessageBox.information(self, "Print Receipt", 
                              "This would print the receipt in a real application.")


class POSView(BaseView):
    """Point of Sale view for processing sales transactions"""
    
    def __init__(self, parent=None):
        super().__init__("Point of Sale", parent)
        self.logger = get_logger()
        self.init_ui()
    
    def init_ui(self):
        # Create main layout with splitter
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        self.main_layout.addWidget(self.splitter)
        
        # Left side - Product browser
        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        
        # Customer selection area
        self.customer_selector = CustomerSelector()
        self.customer_selector.customer_selected.connect(self.on_customer_selected)
        left_layout.addWidget(self.customer_selector)
        
        # Product selector
        self.product_selector = ProductSelector()
        self.product_selector.product_selected.connect(self.on_product_selected)
        left_layout.addWidget(self.product_selector)
        
        # Right side - Cart
        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)
        
        # Cart header
        cart_header = QLabel("Shopping Cart")
        cart_header.setStyleSheet("font-size: 16px; font-weight: bold;")
        right_layout.addWidget(cart_header)
        
        # Cart widget
        self.cart = SalesCart()
        right_layout.addWidget(self.cart)
        
        # Add widgets to splitter
        self.splitter.addWidget(left_widget)
        self.splitter.addWidget(right_widget)
        
        # Set initial sizes
        self.splitter.setSizes([int(self.width() * 0.6), int(self.width() * 0.4)])
    
    def on_product_selected(self, product):
        """Handle product selection"""
        self.cart.add_item(product)
        
        # Show a little notification
        QToolTip.showText(
            QCursor.pos(),
            f"Added {product['name']} to cart",
            self,
            timeout=1000
        )
    
    def on_customer_selected(self, customer):
        """Handle customer selection"""
        self.cart.set_customer(customer) 