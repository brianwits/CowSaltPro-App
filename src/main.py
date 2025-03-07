#!/usr/bin/env python3
"""
CowSalt Pro - Main Application Entry Point
"""

import sys
import logging
from pathlib import Path

from PyQt6.QtWidgets import QApplication

from core.config import Config
from ui.main_window import MainWindow
from services.logging_service import setup_logging
from database.connection import init_database

def setup_environment():
    """Initialize application environment."""
    # Set up base directories
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / "data"
    log_dir = base_dir / "logs"
    
    # Create necessary directories
    data_dir.mkdir(exist_ok=True)
    log_dir.mkdir(exist_ok=True)
    
    # Initialize logging
    setup_logging(log_dir)
    
    # Load configuration
    Config.load()
    
    # Initialize database
    init_database()

def main():
    """Main application entry point."""
    try:
        # Initialize environment
        setup_environment()
        
        # Create Qt application
        app = QApplication(sys.argv)
        
        # Set application style and theme
        app.setStyle('Fusion')
        
        # Create and show main window
        window = MainWindow()
        window.show()
        
        # Start application event loop
        sys.exit(app.exec())
        
    except Exception as e:
        logging.critical(f"Application failed to start: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main() 