from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QScrollArea
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QPalette

from ui.models.data_manager import DataManager
from ui.utils.constants import DEFAULT_MARGIN, DEFAULT_SPACING

class BaseView(QWidget):
    """
    Base view for all application views.
    Provides common functionality and layout structure.
    """
    # Signal emitted when view needs refresh
    refresh_requested = pyqtSignal()
    
    def __init__(self, title="", parent=None):
        super().__init__(parent)
        self.title = title
        self.data_manager = DataManager()
        self.init_base_ui()
    
    def init_base_ui(self):
        """Initialize the base UI elements"""
        # Set up main layout
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(DEFAULT_MARGIN, DEFAULT_MARGIN, DEFAULT_MARGIN, DEFAULT_MARGIN)
        self.main_layout.setSpacing(DEFAULT_SPACING)
        
        # Title label (if title is provided)
        if self.title:
            self.add_title(self.title)
    
    def add_title(self, title_text):
        """Add a title heading to the view"""
        title_label = QLabel(title_text)
        title_label.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        self.main_layout.addWidget(title_label)
        
        # Add horizontal line
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        separator.setFixedHeight(1)
        self.main_layout.addWidget(separator)
        self.main_layout.addSpacing(DEFAULT_SPACING)
        
        return title_label
    
    def add_section_header(self, header_text):
        """Add a section header to the view"""
        header_label = QLabel(header_text)
        header_label.setFont(QFont("Segoe UI", 14, QFont.Weight.DemiBold))
        self.main_layout.addWidget(header_label)
        self.main_layout.addSpacing(DEFAULT_SPACING // 2)
        
        return header_label
    
    def add_stretch(self, stretch=1):
        """Add stretch to push widgets to the top"""
        self.main_layout.addStretch(stretch)
    
    def create_layout(self, orientation="vertical", spacing=DEFAULT_SPACING, margin=0):
        """Create and return a new layout"""
        if orientation.lower() == "horizontal":
            layout = QHBoxLayout()
        else:
            layout = QVBoxLayout()
        
        layout.setContentsMargins(margin, margin, margin, margin)
        layout.setSpacing(spacing)
        
        return layout
    
    def create_scrollable_widget(self, widget):
        """Create a scrollable container for the given widget"""
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setWidget(widget)
        scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        
        # Make scrollbar always visible
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll_area.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        
        return scroll_area
    
    def make_scrollable(self):
        """Make the entire view scrollable"""
        # Create a container widget for the content
        content_widget = QWidget()
        
        # Move all existing widgets to the container
        content_layout = QVBoxLayout(content_widget)
        
        # Move all items from main_layout to content_layout
        while self.main_layout.count():
            item = self.main_layout.takeAt(0)
            if item.widget():
                content_layout.addWidget(item.widget())
            elif item.layout():
                content_layout.addLayout(item.layout())
            elif item.spacerItem():
                content_layout.addSpacerItem(item.spacerItem())
        
        # Create scroll area
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setWidget(content_widget)
        scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        
        # Add scroll area to main layout
        self.main_layout.addWidget(scroll_area)
    
    def create_card(self, title=None, content=None):
        """Create a card widget with optional title and content"""
        card = QFrame()
        card.setObjectName("card")
        card.setFrameShape(QFrame.Shape.StyledPanel)
        card.setStyleSheet("""
            #card {
                background-color: white;
                border-radius: 8px;
                border: 1px solid #E0E0E0;
            }
        """)
        
        # Set up card layout
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(15, 15, 15, 15)
        card_layout.setSpacing(10)
        
        # Add title if provided
        if title:
            title_label = QLabel(title)
            title_label.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            card_layout.addWidget(title_label)
            
            # Add separator
            separator = QFrame()
            separator.setFrameShape(QFrame.Shape.HLine)
            separator.setFrameShadow(QFrame.Shadow.Sunken)
            separator.setFixedHeight(1)
            card_layout.addWidget(separator)
            card_layout.addSpacing(5)
        
        # Add content if provided
        if content:
            if isinstance(content, QWidget):
                card_layout.addWidget(content)
            elif isinstance(content, str):
                content_label = QLabel(content)
                content_label.setWordWrap(True)
                card_layout.addWidget(content_label)
        
        return card
    
    def update_view(self):
        """
        Update the view with fresh data.
        This should be overridden by subclasses.
        """
        pass
    
    def refresh(self):
        """Refresh the view data and emit signal"""
        self.update_view()
        self.refresh_requested.emit()
    
    def handle_action(self, action_name, data=None):
        """
        Handle an action triggered from within the view.
        This should be overridden by subclasses.
        """ 