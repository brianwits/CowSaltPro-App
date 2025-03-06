import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
from ui.models.data_manager import DataManager

class BaseChart(FigureCanvas):
    """
    Base chart class that provides common functionality for all charts
    Reduces code duplication among chart widgets
    """
    def __init__(self, data_manager=None, parent=None, width=5, height=4, dpi=100, title=None):
        """Initialize the base chart widget"""
        # Create figure and axes
        self.fig = Figure(figsize=(width, height), dpi=dpi)
        self.axes = self.fig.add_subplot(111)
        super().__init__(self.fig)
        
        # Set parent
        self.setParent(parent)
        
        # Get or create data manager
        self.data_manager = data_manager if data_manager else DataManager()
        
        # Set title if provided
        self.chart_title = title
        if title:
            self.axes.set_title(title)
            
        # Enable grid
        self.axes.grid(True, linestyle='--', alpha=0.7)
        
        # Apply tight layout
        self.fig.tight_layout()
        
    def clear(self):
        """Clear the chart"""
        self.axes.clear()
        
        # Restore title if set
        if self.chart_title:
            self.axes.set_title(self.chart_title)
            
        # Restore grid
        self.axes.grid(True, linestyle='--', alpha=0.7)
        
    def update_chart(self):
        """
        Update the chart with current data
        This method should be overridden by subclasses
        """
        pass
        
    def set_labels(self, x_label=None, y_label=None):
        """Set chart labels"""
        if x_label:
            self.axes.set_xlabel(x_label)
        if y_label:
            self.axes.set_ylabel(y_label)
            
    def format_axes(self):
        """Apply formatting to the axes"""
        self.fig.tight_layout()
        
    def draw_chart(self):
        """Draw the chart"""
        self.format_axes()
        self.draw() 