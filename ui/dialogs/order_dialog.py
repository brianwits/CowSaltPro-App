from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QPushButton, QComboBox, QDateEdit, QSpinBox, QDoubleSpinBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QFrame, 
    QFormLayout, QGridLayout, QMessageBox
)
from PyQt6.QtCore import Qt, QDate, pyqtSignal
from PyQt6.QtGui import QFont, QIcon

class OrderDialog(QDialog):
    """Dialog for creating new purchase orders from suppliers"""
    
    order_created = pyqtSignal(dict)  # Signal emitted when an order is created
    
    def __init__(self, parent=None, data_manager=None):
        super().__init__(parent)
        self.data_manager = data_manager
        self.order_items = []
        self.init_ui()
        
    def init_ui(self):
        """Initialize the dialog UI"""
        # Set dialog properties
        self.setWindowTitle("New Purchase Order")
        self.setMinimumWidth(700)
        self.setMinimumHeight(500)
        self.setWindowIcon(QIcon("Resources/icons/order.png"))
        
        # Main layout
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        
        # Order header section
        header_frame = QFrame()
        header_frame.setFrameShape(QFrame.Shape.StyledPanel)
        header_frame.setStyleSheet("background-color: #f8f9fa; border-radius: 4px;")
        
        header_layout = QGridLayout(header_frame)
        header_layout.setContentsMargins(15, 15, 15, 15)
        
        # Supplier selection
        header_layout.addWidget(QLabel("Supplier:"), 0, 0)
        self.supplier_combo = QComboBox()
        self.supplier_combo.addItems(["Select Supplier", "Salt Supplier Inc.", "Packaging Materials Ltd.", "Equipment Supplies Co."])
        header_layout.addWidget(self.supplier_combo, 0, 1)
        
        # Order date
        header_layout.addWidget(QLabel("Order Date:"), 0, 2)
        self.order_date = QDateEdit()
        self.order_date.setCalendarPopup(True)
        self.order_date.setDate(QDate.currentDate())
        header_layout.addWidget(self.order_date, 0, 3)
        
        # Order reference
        header_layout.addWidget(QLabel("Reference:"), 1, 0)
        self.reference = QLineEdit()
        self.reference.setPlaceholderText("PO-00001")
        header_layout.addWidget(self.reference, 1, 1)
        
        # Expected delivery
        header_layout.addWidget(QLabel("Expected Delivery:"), 1, 2)
        self.delivery_date = QDateEdit()
        self.delivery_date.setCalendarPopup(True)
        self.delivery_date.setDate(QDate.currentDate().addDays(7))
        header_layout.addWidget(self.delivery_date, 1, 3)
        
        layout.addWidget(header_frame)
        
        # Order items section
        items_label = QLabel("Order Items")
        items_label.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        layout.addWidget(items_label)
        
        # Table for order items
        self.items_table = QTableWidget(0, 5)  # 0 rows, 5 columns
        self.items_table.setHorizontalHeaderLabels(["Product", "Description", "Quantity", "Unit Price", "Total"])
        self.items_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.items_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.ResizeToContents)
        self.items_table.setAlternatingRowColors(True)
        layout.addWidget(self.items_table, 1)  # Give it a stretch factor of 1
        
        # Add item section
        add_item_frame = QFrame()
        add_item_frame.setFrameShape(QFrame.Shape.StyledPanel)
        add_item_frame.setStyleSheet("background-color: #f8f9fa; border-radius: 4px;")
        
        add_item_layout = QHBoxLayout(add_item_frame)
        
        # Product selection
        add_item_layout.addWidget(QLabel("Product:"))
        self.product_combo = QComboBox()
        self.product_combo.addItems(["Select Product", "Fine Salt", "Coarse Salt", "Table Salt", "Packaging Material", "Equipment"])
        self.product_combo.currentIndexChanged.connect(self.update_product_description)
        add_item_layout.addWidget(self.product_combo)
        
        # Description
        add_item_layout.addWidget(QLabel("Description:"))
        self.description = QLineEdit()
        self.description.setReadOnly(True)
        add_item_layout.addWidget(self.description)
        
        # Quantity
        add_item_layout.addWidget(QLabel("Quantity:"))
        self.quantity = QSpinBox()
        self.quantity.setMinimum(1)
        self.quantity.setMaximum(10000)
        self.quantity.setValue(1)
        self.quantity.valueChanged.connect(self.calculate_total)
        add_item_layout.addWidget(self.quantity)
        
        # Unit price
        add_item_layout.addWidget(QLabel("Unit Price:"))
        self.unit_price = QDoubleSpinBox()
        self.unit_price.setMinimum(0.01)
        self.unit_price.setMaximum(1000000.00)
        self.unit_price.setValue(0.00)
        self.unit_price.setSingleStep(0.10)
        self.unit_price.setPrefix("KES ")
        self.unit_price.valueChanged.connect(self.calculate_total)
        add_item_layout.addWidget(self.unit_price)
        
        # Add button
        self.add_item_btn = QPushButton("Add Item")
        self.add_item_btn.clicked.connect(self.add_item)
        self.add_item_btn.setStyleSheet("""
            QPushButton {
                background-color: #0D6EFD;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
            }
            QPushButton:hover {
                background-color: #0B5ED7;
            }
        """)
        add_item_layout.addWidget(self.add_item_btn)
        
        layout.addWidget(add_item_frame)
        
        # Total section
        total_layout = QHBoxLayout()
        total_layout.addStretch()
        
        self.total_label = QLabel("Total: KES 0.00")
        self.total_label.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        total_layout.addWidget(self.total_label)
        
        layout.addLayout(total_layout)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        
        create_btn = QPushButton("Create Order")
        create_btn.clicked.connect(self.create_order)
        create_btn.setStyleSheet("""
            QPushButton {
                background-color: #198754;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #157347;
            }
        """)
        
        buttons_layout.addWidget(cancel_btn)
        buttons_layout.addStretch()
        buttons_layout.addWidget(create_btn)
        
        layout.addLayout(buttons_layout)
    
    def update_product_description(self, index):
        """Update product description based on selected product"""
        if index <= 0:
            self.description.setText("")
            self.unit_price.setValue(0.00)
            return
            
        product_descriptions = {
            "Fine Salt": "Fine grain salt for table use",
            "Coarse Salt": "Coarse grain salt for cooking",
            "Table Salt": "Iodized table salt",
            "Packaging Material": "Packaging bags and materials",
            "Equipment": "Processing equipment",
        }
        
        product_prices = {
            "Fine Salt": 40.00,
            "Coarse Salt": 35.00,
            "Table Salt": 30.00,
            "Packaging Material": 20.00,
            "Equipment": 5000.00,
        }
        
        selected_product = self.product_combo.currentText()
        self.description.setText(product_descriptions.get(selected_product, ""))
        self.unit_price.setValue(product_prices.get(selected_product, 0.00))
        self.calculate_total()
    
    def calculate_total(self):
        """Calculate the total for the current item and overall order"""
        # Calculate line total
        line_total = self.quantity.value() * self.unit_price.value()
        
        # Calculate order total
        order_total = sum(item['total'] for item in self.order_items)
        
        # Update total label
        self.total_label.setText(f"Total: KES {order_total + line_total:.2f}")
    
    def add_item(self):
        """Add an item to the order"""
        product = self.product_combo.currentText()
        
        if product == "Select Product":
            QMessageBox.warning(self, "Input Error", "Please select a product.")
            return
        
        description = self.description.text()
        quantity = self.quantity.value()
        unit_price = self.unit_price.value()
        total = quantity * unit_price
        
        # Add to order items list
        item = {
            'product': product,
            'description': description,
            'quantity': quantity,
            'unit_price': unit_price,
            'total': total
        }
        self.order_items.append(item)
        
        # Add to table
        row = self.items_table.rowCount()
        self.items_table.insertRow(row)
        self.items_table.setItem(row, 0, QTableWidgetItem(product))
        self.items_table.setItem(row, 1, QTableWidgetItem(description))
        self.items_table.setItem(row, 2, QTableWidgetItem(str(quantity)))
        self.items_table.setItem(row, 3, QTableWidgetItem(f"KES {unit_price:.2f}"))
        self.items_table.setItem(row, 4, QTableWidgetItem(f"KES {total:.2f}"))
        
        # Reset input fields
        self.product_combo.setCurrentIndex(0)
        self.quantity.setValue(1)
        self.unit_price.setValue(0.00)
        
        # Update total
        order_total = sum(item['total'] for item in self.order_items)
        self.total_label.setText(f"Total: KES {order_total:.2f}")
    
    def create_order(self):
        """Create the order"""
        supplier = self.supplier_combo.currentText()
        
        if supplier == "Select Supplier":
            QMessageBox.warning(self, "Input Error", "Please select a supplier.")
            return
        
        if not self.order_items:
            QMessageBox.warning(self, "Input Error", "Please add at least one item to the order.")
            return
        
        # Create order data
        order_data = {
            'supplier': supplier,
            'reference': self.reference.text(),
            'order_date': self.order_date.date().toString("yyyy-MM-dd"),
            'delivery_date': self.delivery_date.date().toString("yyyy-MM-dd"),
            'items': self.order_items,
            'total': sum(item['total'] for item in self.order_items)
        }
        
        # Emit signal with order data
        self.order_created.emit(order_data)
        
        # Show success message
        QMessageBox.information(
            self, 
            "Order Created", 
            f"Purchase Order for {supplier} created successfully.\n\n"
            f"Total: KES {order_data['total']:.2f}\n"
            f"Expected Delivery: {self.delivery_date.date().toString('dd MMM yyyy')}"
        )
        
        # Close dialog
        self.accept() 