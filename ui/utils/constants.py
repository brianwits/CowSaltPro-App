"""
Constants used throughout the application
"""

# Application information
APP_NAME = "CowSalt Pro"
APP_VERSION = "1.0.0"
ORGANIZATION_NAME = "CowSalt"

# Database configuration
DATABASE_NAME = "cowsalt.db"
DATABASE_DIR = "data"

# UI constants
DEFAULT_MARGIN = 10
DEFAULT_SPACING = 10
DEFAULT_PADDING = 5
SIDEBAR_WIDTH = 250
SIDEBAR_COLLAPSED_WIDTH = 64
HEADER_HEIGHT = 60
FOOTER_HEIGHT = 30

# Date formats
DATE_FORMAT = "yyyy-MM-dd"
DATETIME_FORMAT = "yyyy-MM-dd hh:mm:ss"
DATE_DISPLAY_FORMAT = "MMMM d, yyyy"

# Default values
DEFAULT_CURRENCY = "KES"
DEFAULT_CURRENCY_SYMBOL = "KES"

# Table view properties
TABLE_ROW_HEIGHT = 30
TABLE_ALTERNATE_BASE_COLOR_LIGHT = "#F5F5F5"
TABLE_ALTERNATE_BASE_COLOR_DARK = "#2A2A2A"
TABLE_GRIDLINE_COLOR_LIGHT = "#DDDDDD"
TABLE_GRIDLINE_COLOR_DARK = "#333333"

# Dashboard refresh intervals (in milliseconds)
DASHBOARD_AUTO_REFRESH_INTERVAL = 300000  # 5 minutes

# Icons
ICON_SIZE_SMALL = 16
ICON_SIZE_MEDIUM = 24
ICON_SIZE_LARGE = 32

# File paths
RESOURCES_DIR = "Resources"
ICONS_DIR = f"{RESOURCES_DIR}/icons"
FONTS_DIR = f"{RESOURCES_DIR}/fonts"
THEMES_DIR = f"{RESOURCES_DIR}/themes"

# Product Stock Levels
STOCK_LOW_THRESHOLD = 10
STOCK_MEDIUM_THRESHOLD = 50

# Export formats
EXPORT_FORMATS = ["CSV", "Excel", "PDF"]

# User roles
class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"
    CLERK = "clerk"
    VIEWER = "viewer"

# Transaction types
class TransactionType:
    SALE = "sale"
    PURCHASE = "purchase"
    PAYMENT = "payment"
    EXPENSE = "expense"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"

# Payment methods
class PaymentMethod:
    CASH = "cash"
    MPESA = "mpesa"
    BANK = "bank_transfer"
    CHEQUE = "cheque"
    CREDIT = "credit"
    OTHER = "other"

# Product categories
class ProductCategory:
    SALT = "salt"
    PACKAGING = "packaging"
    EQUIPMENT = "equipment"
    OTHER = "other"

# Chart colors for consistent visualization
CHART_COLORS = [
    "#1976D2",  # Blue
    "#388E3C",  # Green
    "#D32F2F",  # Red
    "#FFA000",  # Amber
    "#7B1FA2",  # Purple
    "#00796B",  # Teal
    "#C2185B",  # Pink
    "#00ACC1",  # Cyan
] 