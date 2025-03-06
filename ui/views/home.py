from PyQt6.QtWidgets import QPushButton, QLabel, QWidget, QMessageBox
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from ui.models.data_manager import DataManager
from ui.widgets.base_view import BaseView
from ui.widgets.metric_card import MetricCard
from ui.widgets.quick_actions import QuickActionsWidget
from ui.charts.sales_chart import SalesChart
from ui.charts.inventory_chart import InventoryChart
from ui.dialogs.order_dialog import OrderDialog

class HomeView(BaseView):
    """Home view with dashboard metrics and charts"""
    def __init__(self):
        super().__init__(title="Dashboard")
        self.init_ui()
        
    def init_ui(self):
        # Metrics section
        self.add_section_header("Today's Metrics")
        
        # Metrics cards layout
        metrics_layout = self.create_layout("horizontal", spacing=15)
        
        # Create metric cards
        sales_card = MetricCard("Today's Sales", "KES 25,000", "5% increase from yesterday")
        inventory_card = MetricCard("Current Stock", "500 KG", "Healthy levels")
        orders_card = MetricCard("Pending Orders", "5", "2 urgent orders")
        
        metrics_layout.addWidget(sales_card)
        metrics_layout.addWidget(inventory_card)
        metrics_layout.addWidget(orders_card)
        self.main_layout.addLayout(metrics_layout)
        
        # Charts section
        self.add_section_header("Analytics")
        
        # Charts layout
        charts_layout = self.create_layout("horizontal")
        
        # Sales chart
        sales_chart = SalesChart(self.data_manager, self)
        charts_layout.addWidget(sales_chart)
        
        # Inventory chart
        inventory_chart = InventoryChart(self.data_manager, self)
        charts_layout.addWidget(inventory_chart)
        
        self.main_layout.addLayout(charts_layout)
        
        # Quick actions section with proper styling
        quick_actions_header = QLabel("Quick Actions")
        quick_actions_header.setFont(QFont("Segoe UI", 16, QFont.Weight.Medium))
        quick_actions_header.setStyleSheet("color: #212529; margin-top: 15px; margin-bottom: 5px;")
        self.main_layout.addWidget(quick_actions_header)
        
        # Add spacing between header and buttons
        spacer = QWidget()
        spacer.setFixedHeight(5)
        self.main_layout.addWidget(spacer)
        
        # Add the QuickActionsWidget
        self.quick_actions = QuickActionsWidget(self)
        self.main_layout.addWidget(self.quick_actions)
        
        # Connect quick action signals to handlers
        self.quick_actions.new_sale_clicked.connect(self.on_new_sale)
        self.quick_actions.add_inventory_clicked.connect(self.on_add_inventory)
        self.quick_actions.new_order_clicked.connect(self.on_new_order)
        
        # Add stretch to push everything to the top
        self.add_stretch()
    
    def on_new_sale(self):
        """Handle new sale action"""
        print("New Sale action triggered")
        # In a real implementation, navigate to POS screen or open a new sale dialog
        main_window = self.window()
        try:
            # Try to switch to POS view
            main_window.switch_view(2, "pos")
        except Exception as e:
            print(f"Error switching to POS view: {str(e)}")
    
    def on_add_inventory(self):
        """Handle add inventory action"""
        print("Add Inventory action triggered")
        # In a real implementation, navigate to inventory screen or open inventory dialog
        main_window = self.window()
        try:
            # Try to switch to inventory view
            main_window.switch_view(1, "inventory")
        except Exception as e:
            print(f"Error switching to inventory view: {str(e)}")
    
    def on_new_order(self):
        """Handle new order action"""
        print("New Order action triggered")
        
        # Create and show the order dialog
        order_dialog = OrderDialog(self, self.data_manager)
        order_dialog.order_created.connect(self.handle_new_order)
        order_dialog.exec()
    
    def handle_new_order(self, order_data):
        """Handle the created order"""
        try:
            # In a real implementation, this would save to the database
            print(f"New order created for {order_data['supplier']}")
            print(f"Total: KES {order_data['total']:.2f}")
            print(f"Items: {len(order_data['items'])}")
            
            # Show notification in status bar if possible
            main_window = self.window()
            try:
                main_window.statusBar().showMessage(f"Order created: {order_data['reference']} - KES {order_data['total']:.2f}", 5000)
            except:
                pass
                
            # Update pending orders metric card if we had actual data
            # This would be implemented properly in a real application
            
        except Exception as e:
            print(f"Error handling new order: {str(e)}")
            QMessageBox.warning(
                self,
                "Order Processing Error",
                f"There was an error processing your order: {str(e)}"
            ) 