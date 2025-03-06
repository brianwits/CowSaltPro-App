from PyQt6.QtWidgets import QFrame, QVBoxLayout, QLabel
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

class MetricCard(QFrame):
    """
    Custom widget for displaying metrics with title and value
    Reusable component for dashboard metrics
    """
    def __init__(self, title, value, description=None, parent=None, bg_color="#f5f5f5"):
        super().__init__(parent)
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setFrameShadow(QFrame.Shadow.Raised)
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {bg_color};
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }}
        """)
        
        # Layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        
        # Title
        self.title_label = QLabel(title)
        self.title_label.setFont(QFont("Arial", 10))
        self.title_label.setStyleSheet("color: #666;")
        layout.addWidget(self.title_label)
        
        # Value
        self.value_label = QLabel(value)
        self.value_label.setFont(QFont("Arial", 18, QFont.Weight.Bold))
        layout.addWidget(self.value_label)
        
        # Description (optional)
        if description:
            self.desc_label = QLabel(description)
            self.desc_label.setFont(QFont("Arial", 9))
            self.desc_label.setStyleSheet("color: #888;")
            layout.addWidget(self.desc_label)
            
    def update_value(self, value):
        """Update the value displayed on the card"""
        self.value_label.setText(value)
        
    def update_description(self, description):
        """Update the description displayed on the card"""
        if hasattr(self, 'desc_label'):
            self.desc_label.setText(description)
        else:
            self.desc_label = QLabel(description)
            self.desc_label.setFont(QFont("Arial", 9))
            self.desc_label.setStyleSheet("color: #888;")
            self.layout().addWidget(self.desc_label) 