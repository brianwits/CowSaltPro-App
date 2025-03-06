import pandas as pd
import datetime
import matplotlib.pyplot as plt
# Replace the specific Qt6 backend with a more compatible one
# from matplotlib.backends.backend_qt6agg import FigureCanvasQTAgg as FigureCanvas
# Use Qt5Agg backend which is more compatible with our application
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                           QTableWidget, QTableWidgetItem, QPushButton, 
                           QFormLayout, QLineEdit, QDoubleSpinBox, 
                           QDateEdit, QComboBox, QGroupBox, QMessageBox,
                           QTabWidget)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QColor

from ui.models.data_manager import DataManager

class PaymentsChart(FigureCanvas):
    """Widget for displaying payments chart"""
    def __init__(self, data_manager, parent=None, width=5, height=4, dpi=100):
        self.fig = Figure(figsize=(width, height), dpi=dpi)
        self.axes = self.fig.add_subplot(111)
        super().__init__(self.fig)
        self.setParent(parent)
        self.data_manager = data_manager
        
        # Create empty chart initially
        self.axes.set_title('Payments by Method')
        self.axes.text(0.5, 0.5, 'No payment data available', 
                     horizontalalignment='center',
                     verticalalignment='center',
                     transform=self.axes.transAxes)
        
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        try:
            self.axes.clear()
            
            # Get payments data
            payments_df = self.data_manager.get_payments()
            
            if not payments_df.empty and len(payments_df) > 0:
                try:
                    # Convert date to datetime
                    payments_df['date'] = pd.to_datetime(payments_df['date'], errors='coerce')
                    
                    # Group by payment method
                    payment_methods = payments_df.groupby('payment_method')['amount'].sum()
                    
                    if not payment_methods.empty and len(payment_methods) > 0:
                        # Plot
                        colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6']
                        self.axes.pie(
                            payment_methods.values,
                            labels=payment_methods.index,
                            autopct='%1.1f%%',
                            startangle=90,
                            colors=colors
                        )
                        self.axes.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
                        self.axes.set_title('Payments by Method')
                    else:
                        self.show_no_data_message("No payment methods found")
                except Exception as e:
                    from ui.utils.logger import get_logger
                    logger = get_logger()
                    logger.error(f"Error creating payment chart: {str(e)}", exc_info=True)
                    self.show_no_data_message(f"Error: {str(e)}")
            else:
                self.show_no_data_message("No payment data available")
                
            self.figure.tight_layout()
            self.draw()
        except Exception as e:
            # Log the error
            from ui.utils.logger import get_logger
            logger = get_logger()
            logger.error(f"Error updating payment chart: {str(e)}", exc_info=True)
            
            # Show error on chart
            self.axes.clear()
            self.axes.text(0.5, 0.5, f'Error updating chart: {str(e)}', 
                         horizontalalignment='center',
                         verticalalignment='center',
                         transform=self.axes.transAxes,
                         color='red')
            self.figure.tight_layout()
            self.draw()
            
    def show_no_data_message(self, message="No data available"):
        """Show a message when no data is available"""
        self.axes.clear()
        self.axes.text(0.5, 0.5, message, 
                     horizontalalignment='center',
                     verticalalignment='center',
                     transform=self.axes.transAxes)
        self.axes.set_title('Payments by Method')
        self.axes.axis('off')

class PaymentsView(QWidget):
    """Payments view for managing customer payments"""
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
        
        # Payments header
        header_label = QLabel("Payments")
        header_label.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        main_layout.addWidget(header_label)
        
        # Tab widget
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)
        
        # All Payments tab
        self.all_payments_tab = QWidget()
        self.tabs.addTab(self.all_payments_tab, "All Payments")
        self.init_all_payments_tab()
        
        # New Payment tab
        self.new_payment_tab = QWidget()
        self.tabs.addTab(self.new_payment_tab, "New Payment")
        self.init_new_payment_tab()
        
        # Analytics tab
        self.analytics_tab = QWidget()
        self.tabs.addTab(self.analytics_tab, "Analytics")
        self.init_analytics_tab()
        
    def init_all_payments_tab(self):
        """Initialize All Payments tab"""
        layout = QVBoxLayout(self.all_payments_tab)
        
        # Payments table
        self.payments_table = QTableWidget()
        self.payments_table.setColumnCount(6)
        self.payments_table.setHorizontalHeaderLabels([
            "ID", "Date", "Customer", "Amount", "Payment Method", "Reference"
        ])
        self.payments_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        # Add buttons - search, filter, etc.
        button_layout = QHBoxLayout()
        
        # Refresh button
        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.load_payments_data)
        
        button_layout.addStretch(1)
        button_layout.addWidget(refresh_btn)
        
        # Add widgets to layout
        layout.addWidget(self.payments_table)
        layout.addLayout(button_layout)
        
        # Load data
        self.load_payments_data()
        
    def init_new_payment_tab(self):
        """Initialize New Payment tab"""
        layout = QVBoxLayout(self.new_payment_tab)
        
        # Form group
        form_group = QGroupBox("Record New Payment")
        form_layout = QFormLayout()
        
        # Date
        self.date_edit = QDateEdit()
        self.date_edit.setDate(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        form_layout.addRow("Date:", self.date_edit)
        
        # Customer
        self.customer_input = QLineEdit()
        form_layout.addRow("Customer:", self.customer_input)
        
        # Amount
        self.amount_input = QDoubleSpinBox()
        self.amount_input.setRange(0, 1000000)
        self.amount_input.setPrefix("KES ")
        form_layout.addRow("Amount:", self.amount_input)
        
        # Payment method
        self.method_combo = QComboBox()
        self.method_combo.addItems([
            "Cash", "M-Pesa", "Bank Transfer", "Cheque", "Credit Card"
        ])
        form_layout.addRow("Payment Method:", self.method_combo)
        
        # Reference
        self.reference_input = QLineEdit()
        self.reference_input.setPlaceholderText("Transaction ID, Cheque Number, etc.")
        form_layout.addRow("Reference:", self.reference_input)
        
        # Add button
        add_btn = QPushButton("Record Payment")
        add_btn.clicked.connect(self.add_payment)
        form_layout.addRow("", add_btn)
        
        form_group.setLayout(form_layout)
        
        # Add widgets to layout
        layout.addWidget(form_group)
        layout.addStretch(1)
        
    def init_analytics_tab(self):
        """Initialize Analytics tab"""
        layout = QVBoxLayout(self.analytics_tab)
        
        # Chart
        self.payments_chart = PaymentsChart(self.data_manager, self)
        
        # Summary group
        summary_group = QGroupBox("Payment Summary")
        summary_layout = QVBoxLayout()
        
        # Summary table
        self.summary_table = QTableWidget()
        self.summary_table.setColumnCount(2)
        self.summary_table.setHorizontalHeaderLabels([
            "Payment Method", "Total Amount"
        ])
        self.summary_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        
        summary_layout.addWidget(self.summary_table)
        summary_group.setLayout(summary_layout)
        
        # Add widgets to layout
        layout.addWidget(self.payments_chart)
        layout.addWidget(summary_group)
        
        # Load data
        self.load_summary_data()
        
    def load_payments_data(self):
        """Load payments data into table"""
        payments_df = self.data_manager.get_payments()
        
        if not payments_df.empty:
            # Sort by date descending to show most recent first
            payments_df = payments_df.sort_values('date', ascending=False)
            
            # Set up table
            self.payments_table.setRowCount(len(payments_df))
            
            for i, row in enumerate(payments_df.itertuples()):
                self.payments_table.setItem(i, 0, QTableWidgetItem(str(row.id)))
                self.payments_table.setItem(i, 1, QTableWidgetItem(str(row.date)))
                self.payments_table.setItem(i, 2, QTableWidgetItem(str(row.customer)))
                
                # Format amount
                amount_item = QTableWidgetItem(f"KES {row.amount:.2f}")
                amount_item.setForeground(QColor("#27ae60"))  # Green for money
                self.payments_table.setItem(i, 3, amount_item)
                
                self.payments_table.setItem(i, 4, QTableWidgetItem(str(row.payment_method)))
                
                # Reference may be None
                reference = str(row.reference) if row.reference else ""
                self.payments_table.setItem(i, 5, QTableWidgetItem(reference))
        else:
            self.payments_table.setRowCount(0)
            
    def load_summary_data(self):
        """Load payment summary data"""
        payments_df = self.data_manager.get_payments()
        
        if not payments_df.empty:
            # Group by payment method
            summary = payments_df.groupby('payment_method')['amount'].sum()
            
            # Set up table
            self.summary_table.setRowCount(len(summary))
            
            for i, (method, amount) in enumerate(summary.items()):
                self.summary_table.setItem(i, 0, QTableWidgetItem(str(method)))
                
                # Format amount
                amount_item = QTableWidgetItem(f"KES {amount:.2f}")
                amount_item.setForeground(QColor("#27ae60"))  # Green for money
                self.summary_table.setItem(i, 1, amount_item)
        else:
            self.summary_table.setRowCount(0)
            
    def add_payment(self):
        """Add a new payment"""
        try:
            # Get and validate date
            date = self.date_edit.date().toString("yyyy-MM-dd")
            
            # Get and validate customer
            customer = self.customer_input.text().strip()
            if not customer:
                QMessageBox.warning(self, "Validation Error", "Please enter a customer name")
                self.customer_input.setFocus()
                return
            
            # Get and validate amount
            amount = self.amount_input.value()
            if amount <= 0:
                QMessageBox.warning(self, "Validation Error", "Amount must be greater than zero")
                self.amount_input.setFocus()
                return
            
            # Get payment method
            payment_method = self.method_combo.currentText()
            
            # Get reference (optional)
            reference = self.reference_input.text().strip() or None
            
            # Add payment to database
            try:
                self.data_manager.add_payment(date, customer, amount, payment_method, reference)
                QMessageBox.information(self, "Success", "Payment recorded successfully")
                
                # Clear form
                self.date_edit.setDate(QDate.currentDate())
                self.customer_input.clear()
                self.amount_input.setValue(0)
                self.reference_input.clear()
                
                # Switch to All Payments tab
                self.tabs.setCurrentIndex(0)
                
                # Reload data
                self.load_payments_data()
                self.load_summary_data()
                self.payments_chart.update_chart()
            except Exception as e:
                # Log the error and show specific message to user
                import traceback
                error_details = traceback.format_exc()
                from ui.utils.logger import get_logger
                logger = get_logger()
                logger.error(f"Payment recording failed: {str(e)}\n{error_details}")
                
                # Show more detailed error message to help debugging
                QMessageBox.critical(
                    self, 
                    "Database Error", 
                    f"Failed to record payment: {str(e)}\n\nPlease check the application logs for details."
                )
        except Exception as e:
            # Catch any other unexpected errors
            QMessageBox.critical(self, "Error", f"An unexpected error occurred: {str(e)}")
            
    def on_data_changed(self, data_type):
        """Handle data change events"""
        if data_type == "payments":
            self.load_payments_data()
            self.load_summary_data()
            self.payments_chart.update_chart() 