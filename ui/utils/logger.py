import os
import logging
import datetime
from logging.handlers import RotatingFileHandler

class Logger:
    """
    Application logger for handling errors, warnings, and debug information.
    Implements a singleton pattern to ensure consistent logging across the application.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance._initialize_logger()
        return cls._instance
    
    def _initialize_logger(self):
        """Initialize the logger with file and console handlers"""
        # Create logs directory if it doesn't exist
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
        if not os.path.exists(logs_dir):
            os.makedirs(logs_dir)
            
        # Create logger
        self.logger = logging.getLogger('cowsaltpro')
        self.logger.setLevel(logging.DEBUG)
        
        # Create handlers
        log_file = os.path.join(logs_dir, f'app_{datetime.datetime.now().strftime("%Y%m%d")}.log')
        file_handler = RotatingFileHandler(
            log_file, 
            maxBytes=5*1024*1024,  # 5MB max file size
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Create formatters
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        )
        console_formatter = logging.Formatter(
            '%(levelname)s - %(message)s'
        )
        
        # Set formatters
        file_handler.setFormatter(file_formatter)
        console_handler.setFormatter(console_formatter)
        
        # Add handlers to logger
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
    def debug(self, message):
        """Log debug message"""
        self.logger.debug(message)
        
    def info(self, message):
        """Log info message"""
        self.logger.info(message)
        
    def warning(self, message):
        """Log warning message"""
        self.logger.warning(message)
        
    def error(self, message, exc_info=None):
        """Log error message with optional exception info"""
        self.logger.error(message, exc_info=exc_info)
        
    def critical(self, message, exc_info=None):
        """Log critical message with optional exception info"""
        self.logger.critical(message, exc_info=exc_info)

# Create a singleton instance
logger = Logger()

# Convenience function to get the logger
def get_logger():
    return logger 