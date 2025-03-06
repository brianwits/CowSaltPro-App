from PyQt6.QtCore import QObject, pyqtSignal

class ResponsiveHelper(QObject):
    """
    Helper class for responsive UI design in PyQt applications.
    Helps with adapting UI based on window dimensions.
    """
    # Signal emitted when window is resized with new dimensions
    window_resized = pyqtSignal(int, int)
    
    # Breakpoints for responsive design (similar to common CSS frameworks)
    BREAKPOINTS = {
        'xs': 576,   # Extra small devices
        'sm': 768,   # Small devices
        'md': 992,   # Medium devices
        'lg': 1200,  # Large devices
        'xl': 1400   # Extra large devices
    }
    
    def __init__(self):
        super().__init__()
        self.current_width = 0
        self.current_height = 0
        self.current_breakpoint = None
    
    def notify_resize(self, width, height):
        """Notify listeners about window resize and calculate breakpoint"""
        # Check if dimensions have changed significantly (avoid micro-adjustments)
        if abs(self.current_width - width) > 5 or abs(self.current_height - height) > 5:
            self.current_width = width
            self.current_height = height
            self._update_breakpoint()
            self.window_resized.emit(width, height)
    
    def _update_breakpoint(self):
        """Update the current breakpoint based on width"""
        old_breakpoint = self.current_breakpoint
        
        # Determine new breakpoint
        if self.current_width < self.BREAKPOINTS['xs']:
            self.current_breakpoint = 'xs'
        elif self.current_width < self.BREAKPOINTS['sm']:
            self.current_breakpoint = 'sm'
        elif self.current_width < self.BREAKPOINTS['md']:
            self.current_breakpoint = 'md'
        elif self.current_width < self.BREAKPOINTS['lg']:
            self.current_breakpoint = 'lg'
        elif self.current_width < self.BREAKPOINTS['xl']:
            self.current_breakpoint = 'xl'
        else:
            self.current_breakpoint = 'xxl'
        
        # Return True if breakpoint changed
        return old_breakpoint != self.current_breakpoint
    
    def is_mobile(self):
        """Check if current breakpoint indicates a mobile view (xs or sm)"""
        return self.current_breakpoint in ['xs', 'sm']
    
    def is_tablet(self):
        """Check if current breakpoint indicates a tablet view (md)"""
        return self.current_breakpoint == 'md'
    
    def is_desktop(self):
        """Check if current breakpoint indicates a desktop view (lg, xl, xxl)"""
        return self.current_breakpoint in ['lg', 'xl', 'xxl']
    
    def get_ideal_sidebar_width(self):
        """Get ideal sidebar width based on current breakpoint"""
        if self.current_breakpoint == 'xs':
            return 0  # Hidden by default on xs
        elif self.current_breakpoint == 'sm':
            return 64  # Icon-only on sm
        elif self.current_breakpoint == 'md':
            return 200  # Narrower sidebar on md
        else:
            return 250  # Full sidebar on lg and larger
    
    def get_ideal_content_margins(self):
        """Get ideal content margins based on current breakpoint"""
        if self.current_breakpoint == 'xs':
            return 8, 8, 8, 8  # Minimal margins on xs
        elif self.current_breakpoint == 'sm':
            return 10, 10, 10, 10
        elif self.current_breakpoint == 'md':
            return 15, 15, 15, 15
        else:
            return 20, 20, 20, 20  # Larger margins on lg and larger
    
    def get_layout_orientation(self, default_horizontal=True):
        """
        Determine if layout should be horizontal or vertical based on screen size.
        Useful for responsive layouts that should stack on smaller screens.
        """
        if self.is_mobile():
            return False  # Vertical on mobile
        return default_horizontal 