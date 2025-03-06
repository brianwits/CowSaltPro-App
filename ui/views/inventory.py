import pandas as pd
import datetime
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                           QTabWidget, QTableWidget, QTableWidgetItem,
                           QPushButton, QFormLayout, QLineEdit, QSpinBox,
                           QDoubleSpinBox, QComboBox, QMessageBox, QGroupBox)
from PyQt6.QtCore import Qt, QDateTime
from PyQt6.QtGui import QFont, QColor
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import uuid

from ui.models.data_manager import DataManager

class InventoryChart(FigureCanvas):
    """Widget for displaying inventory levels chart"""
    def __init__(self, data_manager, parent=None, width=5, height=4, dpi=100):
        fig = Figure(figsize=(width, height), dpi=dpi)
        self.axes = fig.add_subplot(111)
        super().__init__(fig)
        self.setParent(parent)
        self.data_manager = data_manager
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        self.axes.clear()
        
        # Get data
        inventory_df = self.data_manager.get_inventory()
        products_df = self.data_manager.get_products()
        
        if not inventory_df.empty and not products_df.empty:
            # Merge to get product names
            merged_df = pd.merge(inventory_df, products_df, on='product_id')
            
            if not merged_df.empty:
                # Plot
                bars = self.axes.bar(merged_df['name'], merged_df['quantity'], color='#2ecc71')
                
                # Add values on top of bars
                for bar in bars:
                    height = bar.get_height()
                    self.axes.annotate(f'{height}',
                              xy=(bar.get_x() + bar.get_width() / 2, height),
                              xytext=(0, 3),  # 3 points vertical offset
                              textcoords="offset points",
                              ha='center', va='bottom')
        
        self.axes.set_title('Current Inventory Levels')
        self.axes.set_ylabel('Quantity (KG)')
        if hasattr(self.axes, 'set_ylim') and self.axes.get_ylim()[1] > 0:
            self.axes.set_ylim(0, self.axes.get_ylim()[1] * 1.2)
        self.figure.tight_layout()
        self.draw()

class InventoryView(QWidget):
    """Inventory management view"""
    def __init__(self):
        super().__init__()
        self.data_manager = DataManager()
        self.init_ui()
        
        # Connect signals
        self.data_manager.data_changed.connect(self.on_data_changed)
        
    def init_ui(self):
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)
        
        # Inventory header
        header_label = QLabel("Inventory Management")
        header_label.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        main_layout.addWidget(header_label)
        
        # Tab widget
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)
        
        # Current Stock tab
        self.stock_tab = QWidget()
        self.tabs.addTab(self.stock_tab, "Current Stock")
        self.init_stock_tab()
        
        # Product Management tab
        self.products_tab = QWidget()
        self.tabs.addTab(self.products_tab, "Product Management")
        self.init_products_tab()
        
        # Stock Alerts tab
        self.alerts_tab = QWidget()
        self.tabs.addTab(self.alerts_tab, "Stock Alerts")
        self.init_alerts_tab()
        
    def init_stock_tab(self):
        """Initialize Current Stock tab"""
        layout = QVBoxLayout(self.stock_tab)
        
        # Table for inventory
        self.inventory_table = QTableWidget()
        self.inventory_table.setColumnCount(4)
        self.inventory_table.setHorizontalHeaderLabels(["Product ID", "Product Name", "Quantity", "Last Updated"])
        self.inventory_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        # Chart
        self.inventory_chart = InventoryChart(self.data_manager, self)
        
        # Add/Update inventory section
        form_group = QGroupBox("Add/Update Inventory")
        form_layout = QFormLayout()
        
        # Product selection
        self.product_combo = QComboBox()
        form_layout.addRow("Product:", self.product_combo)
        
        # Quantity
        self.quantity_spin = QSpinBox()
        self.quantity_spin.setRange(0, 100000)
        form_layout.addRow("Quantity:", self.quantity_spin)
        
        # Update button
        update_btn = QPushButton("Update Inventory")
        update_btn.clicked.connect(self.update_inventory)
        form_layout.addRow("", update_btn)
        
        form_group.setLayout(form_layout)
        
        # Add widgets to layout
        layout.addWidget(self.inventory_table)
        layout.addWidget(self.inventory_chart)
        layout.addWidget(form_group)
        
        # Load data
        self.load_inventory_data()
        self.load_product_combo()
        
    def init_products_tab(self):
        """Initialize Product Management tab"""
        layout = QVBoxLayout(self.products_tab)
        
        # Table for products
        self.products_table = QTableWidget()
        self.products_table.setColumnCount(4)
        self.products_table.setHorizontalHeaderLabels(["Product ID", "Name", "Price", "Reorder Level"])
        self.products_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        # Add product section
        form_group = QGroupBox("Add New Product")
        form_layout = QFormLayout()
        
        # Product ID (auto-generated)
        self.product_id_input = QLineEdit()
        self.product_id_input.setPlaceholderText("Auto-generated")
        self.product_id_input.setReadOnly(True)
        form_layout.addRow("Product ID:", self.product_id_input)
        
        # Name
        self.product_name_input = QLineEdit()
        form_layout.addRow("Name:", self.product_name_input)
        
        # Price
        self.price_input = QDoubleSpinBox()
        self.price_input.setRange(0, 1000000)
        self.price_input.setPrefix("KES ")
        form_layout.addRow("Price:", self.price_input)
        
        # Reorder level
        self.reorder_level_input = QSpinBox()
        self.reorder_level_input.setRange(0, 10000)
        form_layout.addRow("Reorder Level:", self.reorder_level_input)
        
        # Add button
        add_btn = QPushButton("Add Product")
        add_btn.clicked.connect(self.add_product)
        form_layout.addRow("", add_btn)
        
        # Generate ID button
        gen_id_btn = QPushButton("Generate ID")
        gen_id_btn.clicked.connect(self.generate_product_id)
        form_layout.addRow("", gen_id_btn)
        
        form_group.setLayout(form_layout)
        
        # Add widgets to layout
        layout.addWidget(self.products_table)
        layout.addWidget(form_group)
        
        # Load data
        self.load_products_data()
        
    def init_alerts_tab(self):
        """Initialize Stock Alerts tab"""
        layout = QVBoxLayout(self.alerts_tab)
        
        # Table for alerts
        self.alerts_table = QTableWidget()
        self.alerts_table.setColumnCount(4)
        self.alerts_table.setHorizontalHeaderLabels(["Product ID", "Name", "Current Quantity", "Reorder Level"])
        self.alerts_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        # Alerts label
        self.alerts_label = QLabel("No products below reorder level")
        self.alerts_label.setStyleSheet("color: green; font-weight: bold;")
        
        layout.addWidget(self.alerts_label)
        layout.addWidget(self.alerts_table)
        
        # Load data
        self.load_alerts_data()
        
    def load_inventory_data(self):
        """Load inventory data into table"""
        inventory_df = self.data_manager.get_inventory()
        products_df = self.data_manager.get_products()
        
        if not inventory_df.empty and not products_df.empty:
            # Merge to get product names
            merged_df = pd.merge(inventory_df, products_df, on='product_id')
            
            # Set up table
            self.inventory_table.setRowCount(len(merged_df))
            
            for i, row in enumerate(merged_df.itertuples()):
                self.inventory_table.setItem(i, 0, QTableWidgetItem(str(row.product_id)))
                self.inventory_table.setItem(i, 1, QTableWidgetItem(str(row.name)))
                self.inventory_table.setItem(i, 2, QTableWidgetItem(str(row.quantity)))
                self.inventory_table.setItem(i, 3, QTableWidgetItem(str(row.last_updated)))
        else:
            self.inventory_table.setRowCount(0)
            
    def load_products_data(self):
        """Load products data into table"""
        products_df = self.data_manager.get_products()
        
        if not products_df.empty:
            # Set up table
            self.products_table.setRowCount(len(products_df))
            
            for i, row in enumerate(products_df.itertuples()):
                self.products_table.setItem(i, 0, QTableWidgetItem(str(row.product_id)))
                self.products_table.setItem(i, 1, QTableWidgetItem(str(row.name)))
                self.products_table.setItem(i, 2, QTableWidgetItem(f"KES {row.price:.2f}"))
                self.products_table.setItem(i, 3, QTableWidgetItem(str(row.reorder_level)))
        else:
            self.products_table.setRowCount(0)
            
    def load_alerts_data(self):
        """Load alerts data into table"""
        inventory_df = self.data_manager.get_inventory()
        products_df = self.data_manager.get_products()
        
        if not inventory_df.empty and not products_df.empty:
            # Merge to get product names
            merged_df = pd.merge(inventory_df, products_df, on='product_id')
            
            # Get products below reorder level
            low_stock = merged_df[merged_df['quantity'] <= merged_df['reorder_level']]
            
            if not low_stock.empty:
                # Update label
                self.alerts_label.setText(f"{len(low_stock)} product(s) below reorder level")
                self.alerts_label.setStyleSheet("color: red; font-weight: bold;")
                
                # Set up table
                self.alerts_table.setRowCount(len(low_stock))
                
                for i, row in enumerate(low_stock.itertuples()):
                    self.alerts_table.setItem(i, 0, QTableWidgetItem(str(row.product_id)))
                    self.alerts_table.setItem(i, 1, QTableWidgetItem(str(row.name)))
                    
                    # Highlight low stock in red
                    quantity_item = QTableWidgetItem(str(row.quantity))
                    quantity_item.setForeground(QColor("red"))
                    self.alerts_table.setItem(i, 2, quantity_item)
                    
                    reorder_item = QTableWidgetItem(str(row.reorder_level))
                    self.alerts_table.setItem(i, 3, reorder_item)
            else:
                self.alerts_label.setText("No products below reorder level")
                self.alerts_label.setStyleSheet("color: green; font-weight: bold;")
                self.alerts_table.setRowCount(0)
        else:
            self.alerts_table.setRowCount(0)
            
    def load_product_combo(self):
        """Load products into combo box"""
        self.product_combo.clear()
        products_df = self.data_manager.get_products()
        
        if not products_df.empty:
            for _, row in products_df.iterrows():
                self.product_combo.addItem(row['name'], row['product_id'])
                
    def update_inventory(self):
        """Update inventory quantity"""
        if self.product_combo.currentIndex() < 0:
            QMessageBox.warning(self, "Error", "Please select a product")
            return
            
        product_id = self.product_combo.currentData()
        quantity = self.quantity_spin.value()
        last_updated = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            self.data_manager.update_inventory(product_id, quantity, last_updated)
            QMessageBox.information(self, "Success", "Inventory updated successfully")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to update inventory: {str(e)}")
            
    def add_product(self):
        """Add a new product"""
        product_id = self.product_id_input.text()
        if not product_id:
            product_id = str(uuid.uuid4())[:8]
            
        name = self.product_name_input.text()
        if not name:
            QMessageBox.warning(self, "Error", "Please enter a product name")
            return
            
        price = self.price_input.value()
        reorder_level = self.reorder_level_input.value()
        
        try:
            self.data_manager.add_product(product_id, name, price, reorder_level)
            QMessageBox.information(self, "Success", "Product added successfully")
            
            # Clear form
            self.product_id_input.clear()
            self.product_name_input.clear()
            self.price_input.setValue(0)
            self.reorder_level_input.setValue(0)
            
            # Reload data
            self.load_products_data()
            self.load_product_combo()
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to add product: {str(e)}")
            
    def generate_product_id(self):
        """Generate a unique product ID"""
        self.product_id_input.setText(str(uuid.uuid4())[:8])
        
    def on_data_changed(self, data_type):
        """Handle data change events"""
        if data_type == "products":
            self.load_products_data()
            self.load_product_combo()
            self.load_alerts_data()
        elif data_type == "inventory":
            self.load_inventory_data()
            self.load_alerts_data()
            self.inventory_chart.update_chart() 