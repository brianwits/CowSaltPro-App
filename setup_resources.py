import os
import sys
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QIcon, QPixmap, QPainter, QColor, QFont
from PyQt6.QtCore import Qt, QSize, QRect

def create_placeholder_icon(name, color, text=None):
    """Create a simple placeholder icon"""
    size = 64
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.GlobalColor.transparent)
    
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    
    # Draw circle background
    painter.setBrush(QColor(color))
    painter.setPen(Qt.PenStyle.NoPen)
    painter.drawEllipse(4, 4, size-8, size-8)
    
    # Draw text if provided
    if text:
        painter.setPen(QColor("white"))
        font = QFont("Arial", 20, QFont.Weight.Bold)
        painter.setFont(font)
        painter.drawText(QRect(0, 0, size, size), Qt.AlignmentFlag.AlignCenter, text)
    
    painter.end()
    
    # Make sure the directory exists
    os.makedirs("Resources/icons", exist_ok=True)
    
    # Save the icon
    path = os.path.join("Resources", "icons", f"{name}.png")
    pixmap.save(path)
    print(f"Created icon: {path}")
    
    return path

def main():
    app = QApplication(sys.argv)
    
    # Create basic icons
    create_placeholder_icon("dashboard", "#2196F3", "D")
    create_placeholder_icon("inventory", "#4CAF50", "I")
    create_placeholder_icon("pos", "#FFC107", "P")
    create_placeholder_icon("production", "#FF5722", "P")
    create_placeholder_icon("formula", "#9C27B0", "F")
    create_placeholder_icon("ledger", "#795548", "L")
    create_placeholder_icon("cashbook", "#607D8B", "C")
    create_placeholder_icon("payments", "#3F51B5", "P")
    create_placeholder_icon("reports", "#009688", "R")
    create_placeholder_icon("users", "#E91E63", "U")
    create_placeholder_icon("settings", "#9E9E9E", "S")
    
    # Create action icons
    create_placeholder_icon("add", "#4CAF50", "+")
    create_placeholder_icon("refresh", "#2196F3", "↻")
    create_placeholder_icon("view", "#FFC107", "👁")
    create_placeholder_icon("edit", "#FF9800", "✎")
    create_placeholder_icon("delete", "#F44336", "✕")
    create_placeholder_icon("menu", "#9E9E9E", "☰")
    create_placeholder_icon("ingredients", "#8BC34A", "I")
    create_placeholder_icon("test", "#00BCD4", "T")
    create_placeholder_icon("status", "#3F51B5", "S")
    create_placeholder_icon("in_progress", "#FFC107", "P")
    create_placeholder_icon("completed", "#4CAF50", "C")
    create_placeholder_icon("on_hold", "#F44336", "H")
    create_placeholder_icon("scale", "#2196F3", "⚖")
    create_placeholder_icon("formula_active", "#4CAF50", "A")
    create_placeholder_icon("formula_inactive", "#F44336", "I")
    create_placeholder_icon("versions", "#2196F3", "V")
    create_placeholder_icon("activate", "#4CAF50", "✓")
    create_placeholder_icon("deactivate", "#F44336", "✕")
    create_placeholder_icon("new_version", "#9C27B0", "+")
    create_placeholder_icon("default", "#9E9E9E", "?")
    
    print("All icons created successfully!")

if __name__ == "__main__":
    main() 