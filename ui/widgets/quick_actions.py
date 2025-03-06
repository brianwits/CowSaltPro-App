from PyQt6.QtWidgets import (
    QWidget, QHBoxLayout, QPushButton, QSizePolicy, QToolTip
)
from PyQt6.QtCore import pyqtSignal, Qt
from PyQt6.QtGui import QIcon, QCursor, QFont, QPixmap

class QuickActionsWidget(QWidget):
    """Widget for common quick actions displayed on the dashboard"""
    
    # Signals emitted when action buttons are clicked
    new_sale_clicked = pyqtSignal()
    add_inventory_clicked = pyqtSignal()
    new_order_clicked = pyqtSignal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        """Initialize the UI components"""
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)  # Match spacing in image
        
        # Create action buttons
        self.new_sale_btn = self.create_action_button("New Sale", "sale")
        self.add_inventory_btn = self.create_action_button("Add Inventory", "inventory")
        self.new_order_btn = self.create_action_button("New Order", "order", is_primary=True)
        
        # Set tooltips
        self.new_sale_btn.setToolTip("Create a new sales transaction")
        self.add_inventory_btn.setToolTip("Add new items to inventory")
        self.new_order_btn.setToolTip("Create a new purchase order from suppliers")
        
        # Connect signals
        self.new_sale_btn.clicked.connect(self.new_sale_clicked.emit)
        self.add_inventory_btn.clicked.connect(self.add_inventory_clicked.emit)
        self.new_order_btn.clicked.connect(self.new_order_clicked.emit)
        
        # Add buttons to layout
        layout.addWidget(self.new_sale_btn)
        layout.addWidget(self.add_inventory_btn)
        layout.addWidget(self.new_order_btn)
        layout.addStretch(1)  # Add stretch to push buttons to the left
        
        # Set tooltip style
        QToolTip.setFont(QFont('Segoe UI', 9))
    
    def create_action_button(self, text, icon_name=None, is_primary=False):
        """Create a styled action button"""
        button = QPushButton(text)
        
        # Set font to match Bootstrap
        font = QFont("Segoe UI", 9)
        button.setFont(font)
        
        # Set icon if provided
        if icon_name:
            try:
                # Create default icons if specific ones not found
                if icon_name == "sale":
                    button.setIcon(QIcon("Resources/icons/sale.png"))
                elif icon_name == "inventory":
                    button.setIcon(QIcon("Resources/icons/inventory.png"))
                elif icon_name == "order":
                    button.setIcon(QIcon("Resources/icons/order.png"))
            except:
                pass  # If icon not found, just use text
        
        # Determine button color based on primary flag
        bg_color = "#0D6EFD"  # Default blue
        hover_color = "#0B5ED7"
        active_color = "#0A58CA"
        
        if is_primary:
            bg_color = "#198754"       # Green for primary button
            hover_color = "#157347"    # Darker green for hover
            active_color = "#146C43"   # Even darker for active/pressed
        
        # Set exact styling to match the Bootstrap button in the image
        button.setStyleSheet(f"""
            QPushButton {{
                background-color: {bg_color};
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 14px;
                font-weight: 400;
                min-width: 100px;
                text-align: center;
            }}
            QPushButton:hover {{
                background-color: {hover_color};
            }}
            QPushButton:pressed {{
                background-color: {active_color};
            }}
        """)
        
        button.setCursor(Qt.CursorShape.PointingHandCursor)
        
        # Fixed size to match image exactly
        button.setFixedSize(115, 38)  
        
        return button 