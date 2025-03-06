import pandas as pd
import datetime
from PyQt6.QtWidgets import (QTableWidget, QTableWidgetItem, QPushButton, 
                           QFormLayout, QLineEdit, QDoubleSpinBox, 
                           QDateEdit, QComboBox, QGroupBox, QMessageBox)
from PyQt6.QtCore import Qt, QDate

from ui.widgets.base_view import BaseView
from ui.charts.transactions_chart import TransactionsChart

class LedgerView(BaseView):
    """Ledger view for managing transactions"""
    def __init__(self):
        super().__init__(title="Stores Ledger")
        self.init_ui()
        
        # Connect signals
        self.data_manager.data_changed.connect(self.on_data_changed)
        
    def init_ui(self):
        # Transactions table
        self.transactions_table = QTableWidget()
        self.transactions_table.setColumnCount(6)
        self.transactions_table.setHorizontalHeaderLabels([
            "ID", "Date", "Description", "Amount", "Type", "Category"
        ])
        self.transactions_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        # Chart
        self.transactions_chart = TransactionsChart(self.data_manager, self)
        
        # Add transaction form
        form_group = QGroupBox("Add New Transaction")
        form_layout = QFormLayout()
        
        # Date
        self.date_edit = QDateEdit()
        self.date_edit.setDate(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        form_layout.addRow("Date:", self.date_edit)
        
        # Description
        self.description_input = QLineEdit()
        form_layout.addRow("Description:", self.description_input)
        
        # Amount
        self.amount_input = QDoubleSpinBox()
        self.amount_input.setRange(0, 1000000)
        self.amount_input.setPrefix("KES ")
        form_layout.addRow("Amount:", self.amount_input)
        
        # Transaction type
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Income", "Expense"])
        form_layout.addRow("Type:", self.type_combo)
        
        # Category
        self.category_combo = QComboBox()
        self.category_combo.addItems([
            "Sales", "Purchases", "Salaries", "Utilities", 
            "Rent", "Transport", "Other"
        ])
        self.category_combo.setEditable(True)
        form_layout.addRow("Category:", self.category_combo)
        
        # Add button
        add_btn = QPushButton("Add Transaction")
        add_btn.clicked.connect(self.add_transaction)
        form_layout.addRow("", add_btn)
        
        form_group.setLayout(form_layout)
        
        # Add widgets to layout
        self.main_layout.addWidget(self.transactions_table)
        self.main_layout.addWidget(self.transactions_chart)
        self.main_layout.addWidget(form_group)
        
        # Load data
        self.load_transactions_data()
        
    def load_transactions_data(self):
        """Load transactions data into table"""
        transactions_df = self.data_manager.get_transactions()
        
        if not transactions_df.empty:
            # Set up table
            self.transactions_table.setRowCount(len(transactions_df))
            
            for i, row in enumerate(transactions_df.itertuples()):
                self.transactions_table.setItem(i, 0, QTableWidgetItem(str(row.id)))
                self.transactions_table.setItem(i, 1, QTableWidgetItem(str(row.date)))
                self.transactions_table.setItem(i, 2, QTableWidgetItem(str(row.description)))
                
                # Format amount based on transaction type
                amount_str = f"KES {row.amount:.2f}"
                if row.transaction_type == "Expense":
                    amount_str = f"(KES {row.amount:.2f})"
                    
                self.transactions_table.setItem(i, 3, QTableWidgetItem(amount_str))
                self.transactions_table.setItem(i, 4, QTableWidgetItem(str(row.transaction_type)))
                self.transactions_table.setItem(i, 5, QTableWidgetItem(str(row.category)))
        else:
            self.transactions_table.setRowCount(0)
            
    def add_transaction(self):
        """Add a new transaction"""
        date = self.date_edit.date().toString("yyyy-MM-dd")
        description = self.description_input.text()
        
        if not description:
            QMessageBox.warning(self, "Error", "Please enter a description")
            return
            
        amount = self.amount_input.value()
        if amount <= 0:
            QMessageBox.warning(self, "Error", "Amount must be greater than zero")
            return
            
        transaction_type = self.type_combo.currentText()
        category = self.category_combo.currentText()
        
        try:
            self.data_manager.add_transaction(date, description, amount, transaction_type, category)
            QMessageBox.information(self, "Success", "Transaction added successfully")
            
            # Clear form
            self.date_edit.setDate(QDate.currentDate())
            self.description_input.clear()
            self.amount_input.setValue(0)
            
            # Reload data
            self.load_transactions_data()
            self.transactions_chart.update_chart()
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to add transaction: {str(e)}")
            
    def on_data_changed(self, data_type):
        """Handle data change events"""
        if data_type == "transactions":
            self.load_transactions_data()
            self.transactions_chart.update_chart() 