import datetime
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QComboBox, 
    QPushButton, QDateEdit, QTableWidget, QTableWidgetItem,
    QHeaderView, QFrame, QTabWidget, QGridLayout, QFileDialog
)
from PyQt6.QtCore import Qt, QDate, pyqtSignal
from PyQt6.QtGui import QFont, QIcon, QColor, QTextDocument
from PyQt6.QtPrintSupport import QPrinter, QPrintDialog, QPrintPreviewDialog

from ui.widgets.base_view import BaseView
from ui.utils.constants import (
    DEFAULT_MARGIN, DEFAULT_SPACING, DATE_FORMAT, EXPORT_FORMATS,
    CHART_COLORS, TransactionType
)

class ReportFilterWidget(QWidget):
    """Widget for filtering reports by criteria"""
    filter_changed = pyqtSignal(dict)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
        
    def init_ui(self):
        # Main layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Section title
        title = QLabel("Report Filters")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        layout.addWidget(title)
        
        # Filter container
        filter_frame = QFrame()
        filter_frame.setFrameShape(QFrame.Shape.StyledPanel)
        filter_frame.setStyleSheet("""
            QFrame {
                background-color: #F5F5F5;
                border-radius: 6px;
                border: 1px solid #E0E0E0;
            }
        """)
        
        filter_layout = QGridLayout(filter_frame)
        filter_layout.setContentsMargins(15, 15, 15, 15)
        filter_layout.setSpacing(10)
        
        # Report type
        filter_layout.addWidget(QLabel("Report Type:"), 0, 0)
        self.report_type = QComboBox()
        self.report_type.addItems([
            "Sales Report", 
            "Inventory Report", 
            "Financial Summary",
            "Customer Activity",
            "Product Performance"
        ])
        self.report_type.currentIndexChanged.connect(self.emit_filter_changed)
        filter_layout.addWidget(self.report_type, 0, 1)
        
        # Date range
        filter_layout.addWidget(QLabel("Date Range:"), 1, 0)
        date_range_widget = QWidget()
        date_range_layout = QHBoxLayout(date_range_widget)
        date_range_layout.setContentsMargins(0, 0, 0, 0)
        
        self.date_from = QDateEdit()
        self.date_from.setCalendarPopup(True)
        self.date_from.setDate(QDate.currentDate().addMonths(-1))
        self.date_from.dateChanged.connect(self.emit_filter_changed)
        
        self.date_to = QDateEdit()
        self.date_to.setCalendarPopup(True)
        self.date_to.setDate(QDate.currentDate())
        self.date_to.dateChanged.connect(self.emit_filter_changed)
        
        date_range_layout.addWidget(self.date_from)
        date_range_layout.addWidget(QLabel("to"))
        date_range_layout.addWidget(self.date_to)
        
        filter_layout.addWidget(date_range_widget, 1, 1)
        
        # Category
        filter_layout.addWidget(QLabel("Category:"), 2, 0)
        self.category = QComboBox()
        self.category.addItems(["All Categories", "Salt Products", "Services", "Packaging", "Equipment"])
        self.category.currentIndexChanged.connect(self.emit_filter_changed)
        filter_layout.addWidget(self.category, 2, 1)
        
        # Predefined date ranges
        filter_layout.addWidget(QLabel("Quick Range:"), 3, 0)
        date_buttons_widget = QWidget()
        date_buttons_layout = QHBoxLayout(date_buttons_widget)
        date_buttons_layout.setContentsMargins(0, 0, 0, 0)
        date_buttons_layout.setSpacing(5)
        
        today_btn = QPushButton("Today")
        week_btn = QPushButton("This Week")
        month_btn = QPushButton("This Month")
        quarter_btn = QPushButton("This Quarter")
        year_btn = QPushButton("This Year")
        
        for btn in [today_btn, week_btn, month_btn, quarter_btn, year_btn]:
            btn.setMaximumHeight(28)
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #E0E0E0;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                }
                QPushButton:hover {
                    background-color: #BDBDBD;
                }
                QPushButton:pressed {
                    background-color: #9E9E9E;
                }
            """)
            date_buttons_layout.addWidget(btn)
        
        today_btn.clicked.connect(lambda: self.set_date_range("today"))
        week_btn.clicked.connect(lambda: self.set_date_range("week"))
        month_btn.clicked.connect(lambda: self.set_date_range("month"))
        quarter_btn.clicked.connect(lambda: self.set_date_range("quarter"))
        year_btn.clicked.connect(lambda: self.set_date_range("year"))
        
        filter_layout.addWidget(date_buttons_widget, 3, 1)
        
        # Button row
        button_widget = QWidget()
        button_layout = QHBoxLayout(button_widget)
        button_layout.setContentsMargins(0, 0, 0, 0)
        
        apply_button = QPushButton("Apply Filters")
        apply_button.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
            QPushButton:pressed {
                background-color: #0D47A1;
            }
        """)
        apply_button.clicked.connect(self.apply_filters)
        
        reset_button = QPushButton("Reset")
        reset_button.clicked.connect(self.reset_filters)
        
        button_layout.addWidget(apply_button)
        button_layout.addWidget(reset_button)
        
        filter_layout.addWidget(button_widget, 4, 1, Qt.AlignmentFlag.AlignRight)
        
        layout.addWidget(filter_frame)
    
    def set_date_range(self, range_type):
        """Set predefined date range"""
        print(f"Setting date range to: {range_type}")
        today = QDate.currentDate()
        
        try:
            if range_type == "today":
                self.date_from.setDate(today)
                self.date_to.setDate(today)
            elif range_type == "week":
                # Calculate start of week (Monday)
                days_to_monday = today.dayOfWeek() - 1  # Monday is 1 in Qt
                start_of_week = today.addDays(-days_to_monday)
                self.date_from.setDate(start_of_week)
                self.date_to.setDate(today)
            elif range_type == "month":
                # First day of current month
                start_of_month = QDate(today.year(), today.month(), 1)
                self.date_from.setDate(start_of_month)
                self.date_to.setDate(today)
            elif range_type == "quarter":
                # First day of current quarter
                quarter = (today.month() - 1) // 3
                first_month_of_quarter = quarter * 3 + 1
                start_of_quarter = QDate(today.year(), first_month_of_quarter, 1)
                self.date_from.setDate(start_of_quarter)
                self.date_to.setDate(today)
            elif range_type == "year":
                # First day of current year
                start_of_year = QDate(today.year(), 1, 1)
                self.date_from.setDate(start_of_year)
                self.date_to.setDate(today)
                
            print(f"Date range set from {self.date_from.date().toString('yyyy-MM-dd')} to {self.date_to.date().toString('yyyy-MM-dd')}")
            self.emit_filter_changed()
        except Exception as e:
            print(f"Error setting date range: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def apply_filters(self):
        """Apply the current filters"""
        self.emit_filter_changed()
    
    def reset_filters(self):
        """Reset filters to default values"""
        self.report_type.setCurrentIndex(0)
        self.date_from.setDate(QDate.currentDate().addMonths(-1))
        self.date_to.setDate(QDate.currentDate())
        self.category.setCurrentIndex(0)
        self.emit_filter_changed()
    
    def emit_filter_changed(self):
        """Emit signal with current filter values"""
        filters = {
            "report_type": self.report_type.currentText(),
            "date_from": self.date_from.date().toString(DATE_FORMAT),
            "date_to": self.date_to.date().toString(DATE_FORMAT),
            "category": self.category.currentText()
        }
        self.filter_changed.emit(filters)
    
    def get_current_filters(self):
        """Get current filter values as a dictionary"""
        return {
            "report_type": self.report_type.currentText(),
            "date_from": self.date_from.date().toString(DATE_FORMAT),
            "date_to": self.date_to.date().toString(DATE_FORMAT),
            "category": self.category.currentText()
        }

class ReportDataWidget(QWidget):
    """Widget for displaying report data in a table"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
        
    def init_ui(self):
        # Main layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Table for data
        self.data_table = QTableWidget()
        self.data_table.setAlternatingRowColors(True)
        self.data_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.data_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.data_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        
        # Button row for actions
        action_widget = QWidget()
        action_layout = QHBoxLayout(action_widget)
        action_layout.setContentsMargins(0, 10, 0, 0)
        
        export_label = QLabel("Export as:")
        action_layout.addWidget(export_label)
        
        self.export_format = QComboBox()
        self.export_format.addItems(EXPORT_FORMATS)
        action_layout.addWidget(self.export_format)
        
        export_button = QPushButton("Export")
        export_button.clicked.connect(self.export_data)
        action_layout.addWidget(export_button)
        
        action_layout.addStretch()
        
        print_button = QPushButton("Print")
        print_button.clicked.connect(self.print_report)
        action_layout.addWidget(print_button)
        
        layout.addWidget(self.data_table)
        layout.addWidget(action_widget)
    
    def set_data(self, headers, data):
        """Set report data in the table"""
        self.data_table.clear()
        
        # Set column count and headers
        self.data_table.setColumnCount(len(headers))
        self.data_table.setHorizontalHeaderLabels(headers)
        
        # Add data rows
        self.data_table.setRowCount(len(data))
        for row_idx, row_data in enumerate(data):
            for col_idx, cell_data in enumerate(row_data):
                item = QTableWidgetItem(str(cell_data))
                self.data_table.setItem(row_idx, col_idx, item)
    
    def export_data(self):
        """Export the report data to a file"""
        print("Export button clicked")
        try:
            export_format = self.export_format.currentText()
            file_filter = ""
            if export_format == "CSV":
                file_filter = "CSV files (*.csv)"
                default_ext = ".csv"
            elif export_format == "Excel":
                file_filter = "Excel files (*.xlsx)"
                default_ext = ".xlsx"
            elif export_format == "PDF":
                file_filter = "PDF files (*.pdf)"
                default_ext = ".pdf"
            
            filename, _ = QFileDialog.getSaveFileName(
                self, 
                "Export Report", 
                f"report_{datetime.date.today().strftime('%Y%m%d')}{default_ext}",
                file_filter
            )
            
            if filename:
                print(f"Exporting to {filename} in {export_format} format")
                
                # Basic implementation of export functionality
                if export_format == "CSV":
                    self.export_to_csv(filename)
                elif export_format == "Excel":
                    self.export_to_excel(filename)
                elif export_format == "PDF":
                    self.export_to_pdf(filename)
        except Exception as e:
            print(f"Error during export: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def export_to_csv(self, filename):
        """Export table data to CSV file"""
        try:
            with open(filename, 'w', newline='') as file:
                import csv
                writer = csv.writer(file)
                
                # Write header
                headers = []
                for col in range(self.data_table.columnCount()):
                    headers.append(self.data_table.horizontalHeaderItem(col).text())
                writer.writerow(headers)
                
                # Write data
                for row in range(self.data_table.rowCount()):
                    row_data = []
                    for col in range(self.data_table.columnCount()):
                        item = self.data_table.item(row, col)
                        row_data.append(item.text() if item else "")
                    writer.writerow(row_data)
                    
            print(f"Successfully exported to CSV: {filename}")
        except Exception as e:
            print(f"Error exporting to CSV: {str(e)}")
    
    def export_to_excel(self, filename):
        """Export table data to Excel file"""
        try:
            import pandas as pd
            
            # Convert table to DataFrame
            data = []
            headers = []
            
            for col in range(self.data_table.columnCount()):
                headers.append(self.data_table.horizontalHeaderItem(col).text())
                
            for row in range(self.data_table.rowCount()):
                row_data = []
                for col in range(self.data_table.columnCount()):
                    item = self.data_table.item(row, col)
                    row_data.append(item.text() if item else "")
                data.append(row_data)
                
            df = pd.DataFrame(data, columns=headers)
            df.to_excel(filename, index=False)
            print(f"Successfully exported to Excel: {filename}")
        except Exception as e:
            print(f"Error exporting to Excel: {str(e)}")
    
    def export_to_pdf(self, filename):
        """Export table data to PDF file"""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
            
            # Create PDF document
            doc = SimpleDocTemplate(filename, pagesize=letter)
            
            # Collect data
            table_data = []
            headers = []
            
            for col in range(self.data_table.columnCount()):
                headers.append(self.data_table.horizontalHeaderItem(col).text())
            table_data.append(headers)
            
            for row in range(self.data_table.rowCount()):
                row_data = []
                for col in range(self.data_table.columnCount()):
                    item = self.data_table.item(row, col)
                    row_data.append(item.text() if item else "")
                table_data.append(row_data)
            
            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            # Build PDF
            doc.build([table])
            print(f"Successfully exported to PDF: {filename}")
        except Exception as e:
            print(f"Error exporting to PDF: {str(e)}")
    
    def print_report(self):
        """Print the report"""
        print("Print button clicked")
        try:
            # Configure printer
            printer = QPrinter(QPrinter.PrinterMode.HighResolution)
            printer.setPageSize(QPrinter.PageSize.A4)
            printer.setPageMargins(15, 15, 15, 15, QPrinter.Unit.Millimeter)
            
            # Create print preview dialog
            preview = QPrintPreviewDialog(printer, self)
            
            # Set size and position
            preview.setMinimumSize(1024, 768)
            preview.setWindowTitle("CowSalt Pro - Print Report Preview")
            
            # Center in the screen
            screen_geometry = self.screen().geometry()
            preview.setGeometry(
                (screen_geometry.width() - 1024) // 2,
                (screen_geometry.height() - 768) // 2,
                1024,
                768
            )
            
            # Set window flags for proper modal behavior
            preview.setWindowFlags(
                Qt.WindowType.Dialog | 
                Qt.WindowType.WindowCloseButtonHint | 
                Qt.WindowType.WindowMaximizeButtonHint
            )
            
            # Connect the paint request signal
            preview.paintRequested.connect(self.handle_print_request)
            
            # Show the dialog modal
            if preview.exec():
                print("Print preview accepted")
        except Exception as e:
            print(f"Error during print: {str(e)}")
            import traceback
            traceback.print_exc()
    
    def handle_print_request(self, printer):
        """Handle the actual printing"""
        try:
            # Create a document to print
            document = QTextDocument()
            
            # Set page size to match printer
            document.setPageSize(printer.pageRect().size())
            
            # Create HTML representation of the table with better styling
            html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1 {{ color: #1976D2; text-align: center; margin-bottom: 20px; }}
                    h2 {{ color: #2196F3; margin-bottom: 10px; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                    th {{ background-color: #2196F3; color: white; padding: 8px; text-align: left; }}
                    td {{ padding: 8px; border-bottom: 1px solid #ddd; }}
                    tr:nth-child(even) {{ background-color: #f2f2f2; }}
                </style>
            </head>
            <body>
                <h1>CowSalt Pro Report</h1>
                <h2>{self.parent().parent().parent().filter_widget.report_type.currentText()}</h2>
                <p>Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
                <table>
                    <tr>
            """
            
            # Add header row
            for col in range(self.data_table.columnCount()):
                html += f"<th>{self.data_table.horizontalHeaderItem(col).text()}</th>"
            html += "</tr>"
            
            # Add data rows
            for row in range(self.data_table.rowCount()):
                html += "<tr>"
                for col in range(self.data_table.columnCount()):
                    item = self.data_table.item(row, col)
                    html += f"<td>{item.text() if item else ''}</td>"
                html += "</tr>"
            
            html += """
                </table>
            </body>
            </html>
            """
            
            document.setHtml(html)
            
            # Print the document
            document.print(printer)
            print("Document sent to printer")
        except Exception as e:
            print(f"Error handling print request: {str(e)}")
            import traceback
            traceback.print_exc()

class ChartPlaceholderWidget(QWidget):
    """A placeholder for charts that doesn't require QtChart"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        # Display a message about charts
        message = QLabel(
            "Chart visualization would be displayed here.\n\n"
            "This requires the PyQt6.QtCharts module to be installed.\n"
            "Install it with: pip install PyQt6-Charts"
        )
        message.setAlignment(Qt.AlignmentFlag.AlignCenter)
        message.setStyleSheet("""
            QLabel {
                background-color: #F5F5F5;
                border: 1px dashed #BDBDBD;
                border-radius: 8px;
                padding: 20px;
                color: #757575;
            }
        """)
        layout.addWidget(message)
        
        # Chart type selector
        selector_widget = QWidget()
        selector_layout = QHBoxLayout(selector_widget)
        selector_layout.setContentsMargins(0, 10, 0, 0)
        
        selector_layout.addWidget(QLabel("Chart Type:"))
        
        self.chart_type = QComboBox()
        self.chart_type.addItems(["Bar Chart", "Line Chart", "Pie Chart"])
        selector_layout.addWidget(self.chart_type)
        
        selector_layout.addStretch()
        
        layout.addWidget(selector_widget)
    
    def set_data(self, labels, datasets):
        """Placeholder for setting chart data"""
        # In a real implementation, this would update the chart
        print(f"Chart data would be updated with {len(labels)} labels and {len(datasets)} datasets")

class ReportsView(BaseView):
    """Reports view for displaying various business reports"""
    def __init__(self, parent=None):
        super().__init__("Reports", parent)
        self.init_ui()
        self.load_demo_data()
    
    def init_ui(self):
        # Create filter widget
        self.filter_widget = ReportFilterWidget()
        self.filter_widget.filter_changed.connect(self.update_report)
        self.main_layout.addWidget(self.filter_widget)
        
        # Tabs for report views
        self.tabs = QTabWidget()
        
        # Data tab
        self.data_widget = ReportDataWidget()
        self.tabs.addTab(self.data_widget, "Data")
        
        # Chart tab
        self.chart_widget = ChartPlaceholderWidget()
        self.tabs.addTab(self.chart_widget, "Chart")
        
        # Add tabs to main layout
        self.main_layout.addWidget(self.tabs)
    
    def update_report(self, filters=None):
        """Update report based on filters"""
        if not filters:
            filters = self.filter_widget.get_current_filters()
        
        # In a real application, this would fetch data based on filters
        # For now, just update with demo data and show filter info
        print(f"Updating report with filters: {filters}")
        
        # Update data tab
        self.load_demo_data()
    
    def load_demo_data(self):
        """Load some demo data for the report"""
        # Table data
        headers = ["Date", "Product", "Quantity", "Price", "Total"]
        data = [
            ["2023-01-01", "Fine Salt", 100, 50, 5000],
            ["2023-01-02", "Coarse Salt", 75, 45, 3375],
            ["2023-01-03", "Table Salt", 200, 30, 6000],
            ["2023-01-04", "Fine Salt", 150, 50, 7500],
            ["2023-01-05", "Coarse Salt", 50, 45, 2250],
        ]
        
        self.data_widget.set_data(headers, data)
        
        # Chart data
        labels = ["Fine Salt", "Coarse Salt", "Table Salt"]
        datasets = [
            {
                'name': 'Quantity Sold',
                'data': [250, 125, 200]
            },
            {
                'name': 'Revenue',
                'data': [12500, 5625, 6000]
            }
        ]
        
        self.chart_widget.set_data(labels, datasets)
    
    def update_view(self):
        """Update the view with fresh data"""
        self.update_report() 