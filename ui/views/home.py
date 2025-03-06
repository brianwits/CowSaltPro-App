from PyQt6.QtWidgets import QPushButton
from PyQt6.QtCore import Qt

from ui.models.data_manager import DataManager
from ui.widgets.base_view import BaseView
from ui.widgets.metric_card import MetricCard
from ui.charts.sales_chart import SalesChart
from ui.charts.inventory_chart import InventoryChart

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
        
        # Quick actions section
        self.add_section_header("Quick Actions")
        
        # Actions layout
        actions_layout = self.create_layout("horizontal")
        
        # Action buttons
        new_sale_btn = QPushButton("New Sale")
        add_inventory_btn = QPushButton("Add Inventory")
        new_order_btn = QPushButton("New Order")
        
        actions_layout.addWidget(new_sale_btn)
        actions_layout.addWidget(add_inventory_btn)
        actions_layout.addWidget(new_order_btn)
        actions_layout.addStretch(1)
        
        self.main_layout.addLayout(actions_layout)
        
        # Add stretch to push everything to the top
        self.add_stretch() 