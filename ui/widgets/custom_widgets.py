import os
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, 
    QFrame, QDialog, QMessageBox, QSizePolicy
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize
from PyQt6.QtGui import QIcon, QColor, QFont, QPalette

class InfoCard(QFrame):
    """
    A card widget that displays a title, value, and optional icon
    """
    
    def __init__(self, title, value, icon=None, color="#2196F3", parent=None):
        super().__init__(parent)
        
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setLineWidth(1)
        self.setMinimumSize(150, 120)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        
        # Set custom style
        self.setStyleSheet(f"""
            InfoCard {{
                border: 1px solid #ddd;
                border-left: 4px solid {color};
                border-radius: 4px;
                background-color: #fff;
            }}
        """)
        
        # Create layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 10, 10, 10)
        
        # Title row
        title_layout = QHBoxLayout()
        
        self.title_label = QLabel(title)
        self.title_label.setStyleSheet("font-weight: bold; color: #555;")
        title_layout.addWidget(self.title_label)
        
        if icon and os.path.exists(icon):
            icon_label = QLabel()
            icon_label.setPixmap(QIcon(icon).pixmap(QSize(24, 24)))
            title_layout.addWidget(icon_label)
        
        title_layout.setStretch(0, 1)
        title_layout.setAlignment(Qt.AlignmentFlag.AlignLeft)
        main_layout.addLayout(title_layout)
        
        # Value
        self.value_label = QLabel(value)
        self.value_label.setStyleSheet(f"font-size: 24pt; font-weight: bold; color: {color};")
        self.value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main_layout.addWidget(self.value_label)
        
        # Set the layout
        self.setLayout(main_layout)
    
    def set_value(self, value):
        """Update the value displayed in the card"""
        self.value_label.setText(value)


class FilterHeader(QWidget):
    """
    A header widget with filters for tables
    """
    
    filter_changed = pyqtSignal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Create layout
        self.main_layout = QHBoxLayout(self)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(10)
        
        self.setLayout(self.main_layout)
    
    def add_widget(self, widget):
        """Add a widget to the filter header"""
        self.main_layout.addWidget(widget)
    
    def add_layout(self, layout):
        """Add a layout to the filter header"""
        self.main_layout.addLayout(layout)
    
    def add_stretch(self, stretch=1):
        """Add stretch to the filter header"""
        self.main_layout.addStretch(stretch)


class ConfirmDialog(QDialog):
    """
    A confirmation dialog with customizable title, message, and buttons
    """
    
    def __init__(self, title, message, parent=None):
        super().__init__(parent)
        
        self.setWindowTitle(title)
        self.setMinimumWidth(300)
        
        # Create layout
        main_layout = QVBoxLayout(self)
        
        # Message
        message_label = QLabel(message)
        message_label.setWordWrap(True)
        main_layout.addWidget(message_label)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        
        self.yes_button = QPushButton("Yes")
        self.yes_button.clicked.connect(self.accept)
        buttons_layout.addWidget(self.yes_button)
        
        self.no_button = QPushButton("No")
        self.no_button.clicked.connect(self.reject)
        buttons_layout.addWidget(self.no_button)
        
        main_layout.addLayout(buttons_layout)
        
        self.setLayout(main_layout)


class StatusBadge(QLabel):
    """
    A badge that shows status with colored background
    """
    
    def __init__(self, text, color="#4CAF50", parent=None):
        super().__init__(parent)
        
        self.setText(text)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setStyleSheet(f"""
            QLabel {{
                background-color: {color};
                color: white;
                border-radius: 10px;
                padding: 4px 8px;
                font-weight: bold;
            }}
        """)
        self.setMinimumWidth(80)
    
    def set_status(self, text, color="#4CAF50"):
        """Update status text and color"""
        self.setText(text)
        self.setStyleSheet(f"""
            QLabel {{
                background-color: {color};
                color: white;
                border-radius: 10px;
                padding: 4px 8px;
                font-weight: bold;
            }}
        """) 