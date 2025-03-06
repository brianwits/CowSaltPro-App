from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PyQt6.QtGui import QFont
from ui.models.data_manager import DataManager
from ui.utils.logger import get_logger

class BaseView(QWidget):
    """
    Base view class that provides common functionality for all views
    Reduces code duplication across view classes
    """
    def __init__(self, title="Base View"):
        super().__init__()
        self.title = title
        self.logger = get_logger()
        self.data_manager = DataManager()  # Shared data manager
        self.main_layout = None
        self.init_base_ui()
        
    def init_base_ui(self):
        """Initialize base UI components"""
        # Main layout with standard margins
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(20, 20, 20, 20)
        self.main_layout.setSpacing(20)
        
        # View header
        self.add_header(self.title)
    
    def add_header(self, text, font_size=16):
        """Add a standard header to the view"""
        header_label = QLabel(text)
        header_label.setFont(QFont("Arial", font_size, QFont.Weight.Bold))
        self.main_layout.addWidget(header_label)
        return header_label
        
    def add_section_header(self, text, font_size=12):
        """Add a section header to the view"""
        section_label = QLabel(text)
        section_label.setFont(QFont("Arial", font_size, QFont.Weight.Bold))
        self.main_layout.addWidget(section_label)
        return section_label
        
    def create_layout(self, orientation="vertical", margins=(0, 0, 0, 0), spacing=10):
        """Create a layout with the specified orientation and settings"""
        if orientation.lower() == "vertical":
            layout = QVBoxLayout()
        else:
            layout = QHBoxLayout()
        
        layout.setContentsMargins(*margins)
        layout.setSpacing(spacing)
        return layout
    
    def add_stretch(self):
        """Add a stretch to the main layout"""
        self.main_layout.addStretch(1) 