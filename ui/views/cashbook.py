import pandas as pd
import datetime
from PyQt6.QtWidgets import (QTableWidget, QTableWidgetItem, QPushButton, 
                           QFormLayout, QGroupBox, QMessageBox)
from PyQt6.QtCore import Qt

from ui.widgets.base_view import BaseView
from ui.widgets.summary_card import SummaryCard
from ui.charts.cash_flow_chart import CashFlowChart

class CashbookView(BaseView):
    """Cashbook view for tracking cash inflows and outflows"""
    def __init__(self):
        super().__init__(title="Cash Book")
        self.init_ui()
        
        # Connect signals
        self.data_manager.data_changed.connect(self.on_data_changed)
        
    def init_ui(self):
        # Summary cards
        summary_layout = self.create_layout("horizontal", spacing=15)
        
        # Create summary cards
        self.income_card = SummaryCard("Total Income", "KES 0", color="#2ecc71")
        self.expense_card = SummaryCard("Total Expenses", "KES 0", color="#e74c3c")
        self.balance_card = SummaryCard("Current Balance", "KES 0", color="#3498db")
        
        summary_layout.addWidget(self.income_card)
        summary_layout.addWidget(self.expense_card)
        summary_layout.addWidget(self.balance_card)
        self.main_layout.addLayout(summary_layout)
        
        # Cash flow chart
        self.cash_flow_chart = CashFlowChart(self.data_manager, self)
        self.main_layout.addWidget(self.cash_flow_chart)
        
        # Transactions table
        self.add_section_header("Recent Transactions")
        
        self.transactions_table = QTableWidget()
        self.transactions_table.setColumnCount(5)
        self.transactions_table.setHorizontalHeaderLabels([
            "Date", "Description", "Amount", "Type", "Category"
        ])
        self.transactions_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.main_layout.addWidget(self.transactions_table)
        
        # Load data
        self.load_data()
        
    def load_data(self):
        """Load all data for the view"""
        self.load_transactions_data()
        self.update_summary_cards()
        
    def load_transactions_data(self):
        """Load transactions data into table"""
        transactions_df = self.data_manager.get_transactions()
        
        if not transactions_df.empty:
            # Sort by date (most recent first)
            transactions_df = transactions_df.sort_values(by='date', ascending=False)
            
            # Limit to most recent 20 transactions
            transactions_df = transactions_df.head(20)
            
            # Set up table
            self.transactions_table.setRowCount(len(transactions_df))
            
            for i, row in enumerate(transactions_df.itertuples()):
                self.transactions_table.setItem(i, 0, QTableWidgetItem(str(row.date)))
                self.transactions_table.setItem(i, 1, QTableWidgetItem(str(row.description)))
                
                # Format amount based on transaction type
                amount_str = f"KES {row.amount:.2f}"
                if row.transaction_type == "Expense":
                    amount_str = f"(KES {row.amount:.2f})"
                    
                self.transactions_table.setItem(i, 2, QTableWidgetItem(amount_str))
                self.transactions_table.setItem(i, 3, QTableWidgetItem(str(row.transaction_type)))
                self.transactions_table.setItem(i, 4, QTableWidgetItem(str(row.category)))
        else:
            self.transactions_table.setRowCount(0)
            
    def update_summary_cards(self):
        """Update summary cards with current data"""
        transactions_df = self.data_manager.get_transactions()
        
        if not transactions_df.empty:
            # Calculate totals
            income = transactions_df[transactions_df['transaction_type'] == 'Income']['amount'].sum()
            expense = transactions_df[transactions_df['transaction_type'] == 'Expense']['amount'].sum()
            balance = income - expense
            
            # Update cards
            self.income_card.update_value(f"KES {income:,.2f}")
            self.expense_card.update_value(f"KES {expense:,.2f}")
            self.balance_card.update_value(f"KES {balance:,.2f}")
        else:
            # Default values
            self.income_card.update_value("KES 0.00")
            self.expense_card.update_value("KES 0.00")
            self.balance_card.update_value("KES 0.00")
            
    def on_data_changed(self, data_type):
        """Handle data change events"""
        if data_type == "transactions":
            self.load_data()
            self.cash_flow_chart.update_chart() 