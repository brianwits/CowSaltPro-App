import os
import pandas as pd
import uuid
from datetime import datetime

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QTableWidget, 
    QTableWidgetItem, QComboBox, QLineEdit, QDateEdit, QTextEdit, QSpinBox, 
    QDoubleSpinBox, QMessageBox, QDialog, QFormLayout, QTabWidget,
    QSplitter, QGroupBox, QHeaderView, QScrollArea, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QDate
from PyQt6.QtGui import QIcon, QColor, QFont

from ui.utils.logger import get_logger
from ui.utils.responsive import ResponsiveHelper
from ui.widgets.custom_widgets import (
    FilterHeader, InfoCard, ConfirmDialog, StatusBadge
)

class ProductionView(QWidget):
    """
    View for managing production batches, adding ingredients, and tracking quality
    """
    
    def __init__(self, data_manager, parent=None):
        super().__init__(parent)
        self.data_manager = data_manager
        self.logger = get_logger()
        self.responsive = ResponsiveHelper()
        
        # Connect to data changes
        self.data_manager.data_changed.connect(self.handle_data_changed)
        
        # Setup UI
        self._setup_ui()
        
        # Load initial data
        self._load_data()
    
    def _setup_ui(self):
        """Set up the production management user interface"""
        main_layout = QVBoxLayout()
        
        # Header section
        header_layout = QHBoxLayout()
        self.title_label = QLabel("Production Management")
        self.title_label.setObjectName("viewTitle")
        header_layout.addWidget(self.title_label)
        
        self.new_batch_btn = QPushButton("New Batch")
        self.new_batch_btn.setIcon(QIcon(os.path.join("Resources", "icons", "add.png")))
        self.new_batch_btn.clicked.connect(self.show_new_batch_dialog)
        header_layout.addWidget(self.new_batch_btn)
        
        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.setIcon(QIcon(os.path.join("Resources", "icons", "refresh.png")))
        self.refresh_btn.clicked.connect(self._load_data)
        header_layout.addWidget(self.refresh_btn)
        
        header_layout.setStretch(0, 4)
        header_layout.setStretch(1, 1)
        header_layout.setStretch(2, 1)
        
        main_layout.addLayout(header_layout)
        
        # Status summary cards
        status_layout = QHBoxLayout()
        
        self.in_progress_card = InfoCard(
            title="In Progress", 
            value="0",
            icon=os.path.join("Resources", "icons", "in_progress.png"),
            color="#FFC107"
        )
        status_layout.addWidget(self.in_progress_card)
        
        self.completed_card = InfoCard(
            title="Completed", 
            value="0",
            icon=os.path.join("Resources", "icons", "completed.png"),
            color="#4CAF50"
        )
        status_layout.addWidget(self.completed_card)
        
        self.on_hold_card = InfoCard(
            title="On Hold", 
            value="0",
            icon=os.path.join("Resources", "icons", "on_hold.png"),
            color="#F44336"
        )
        status_layout.addWidget(self.on_hold_card)
        
        self.total_production_card = InfoCard(
            title="Total Production", 
            value="0 kg",
            icon=os.path.join("Resources", "icons", "scale.png"),
            color="#2196F3"
        )
        status_layout.addWidget(self.total_production_card)
        
        main_layout.addLayout(status_layout)
        
        # Production batches table
        self.batches_group = QGroupBox("Production Batches")
        batches_layout = QVBoxLayout()
        
        # Filter section
        filter_layout = QHBoxLayout()
        
        self.status_filter = QComboBox()
        self.status_filter.addItem("All Statuses")
        self.status_filter.addItem("In Progress")
        self.status_filter.addItem("Completed")
        self.status_filter.addItem("On Hold")
        self.status_filter.addItem("Cancelled")
        self.status_filter.currentTextChanged.connect(self._apply_filters)
        filter_layout.addWidget(QLabel("Status:"))
        filter_layout.addWidget(self.status_filter)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by Batch ID or notes...")
        self.search_input.textChanged.connect(self._apply_filters)
        filter_layout.addWidget(QLabel("Search:"))
        filter_layout.addWidget(self.search_input)
        
        date_filter_layout = QHBoxLayout()
        self.date_from = QDateEdit()
        self.date_from.setDate(QDate.currentDate().addMonths(-1))
        self.date_from.setCalendarPopup(True)
        date_filter_layout.addWidget(QLabel("From:"))
        date_filter_layout.addWidget(self.date_from)
        
        self.date_to = QDateEdit()
        self.date_to.setDate(QDate.currentDate())
        self.date_to.setCalendarPopup(True)
        date_filter_layout.addWidget(QLabel("To:"))
        date_filter_layout.addWidget(self.date_to)
        
        self.apply_date_filter_btn = QPushButton("Apply Date Filter")
        self.apply_date_filter_btn.clicked.connect(self._apply_filters)
        date_filter_layout.addWidget(self.apply_date_filter_btn)
        
        filter_layout.addLayout(date_filter_layout)
        
        batches_layout.addLayout(filter_layout)
        
        # Batches table
        self.batches_table = QTableWidget()
        self.batches_table.setColumnCount(7)
        self.batches_table.setHorizontalHeaderLabels([
            "Batch ID", "Creation Date", "Status", "Quantity (kg)",
            "Completion Date", "Notes", "Actions"
        ])
        self.batches_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.batches_table.horizontalHeader().setSectionResizeMode(6, QHeaderView.ResizeMode.ResizeToContents)
        self.batches_table.verticalHeader().setVisible(False)
        self.batches_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        
        batches_layout.addWidget(self.batches_table)
        
        self.batches_group.setLayout(batches_layout)
        main_layout.addWidget(self.batches_group)
        
        self.setLayout(main_layout)
    
    def _load_data(self):
        """Load production batch data from the database"""
        self.logger.info("Loading production batch data")
        
        try:
            # Get batches
            batches_df = self.data_manager.get_production_batches()
            
            # Update summary cards
            if not batches_df.empty:
                in_progress = len(batches_df[batches_df['status'] == 'In Progress'])
                completed = len(batches_df[batches_df['status'] == 'Completed'])
                on_hold = len(batches_df[batches_df['status'] == 'On Hold'])
                
                self.in_progress_card.set_value(str(in_progress))
                self.completed_card.set_value(str(completed))
                self.on_hold_card.set_value(str(on_hold))
                
                # Calculate total production in kg
                total_production = batches_df['production_quantity'].sum()
                self.total_production_card.set_value(f"{total_production:.2f} kg")
            
            # Display in table
            self._populate_batches_table(batches_df)
        
        except Exception as e:
            self.logger.error(f"Error loading production data: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to load production data: {str(e)}")
    
    def _populate_batches_table(self, batches_df):
        """Populate the batches table with data"""
        self.batches_table.setRowCount(0)
        
        if batches_df.empty:
            self.logger.info("No production batches found")
            return
        
        for idx, row in batches_df.iterrows():
            row_position = self.batches_table.rowCount()
            self.batches_table.insertRow(row_position)
            
            # Batch ID
            self.batches_table.setItem(row_position, 0, QTableWidgetItem(row['batch_id']))
            
            # Creation Date
            self.batches_table.setItem(row_position, 1, QTableWidgetItem(row['creation_date']))
            
            # Status with color coding
            status_item = QTableWidgetItem(row['status'])
            if row['status'] == 'In Progress':
                status_item.setBackground(QColor("#FFF9C4"))  # Light yellow
            elif row['status'] == 'Completed':
                status_item.setBackground(QColor("#C8E6C9"))  # Light green
            elif row['status'] == 'On Hold':
                status_item.setBackground(QColor("#FFCDD2"))  # Light red
            elif row['status'] == 'Cancelled':
                status_item.setBackground(QColor("#CFD8DC"))  # Light grey
            self.batches_table.setItem(row_position, 2, status_item)
            
            # Quantity
            self.batches_table.setItem(row_position, 3, QTableWidgetItem(f"{row['production_quantity']} kg"))
            
            # Completion Date
            completion_date = row['completion_date'] if pd.notna(row['completion_date']) else ""
            self.batches_table.setItem(row_position, 4, QTableWidgetItem(completion_date))
            
            # Notes
            notes = row['notes'] if pd.notna(row['notes']) else ""
            self.batches_table.setItem(row_position, 5, QTableWidgetItem(notes))
            
            # Action buttons
            action_cell = QWidget()
            action_layout = QHBoxLayout(action_cell)
            action_layout.setContentsMargins(2, 2, 2, 2)
            action_layout.setSpacing(4)
            
            # View details button
            view_btn = QPushButton("")
            view_btn.setIcon(QIcon(os.path.join("Resources", "icons", "view.png")))
            view_btn.setFixedSize(28, 28)
            view_btn.setToolTip("View Details")
            view_btn.clicked.connect(lambda checked, b_id=row['batch_id']: self.view_batch_details(b_id))
            action_layout.addWidget(view_btn)
            
            # Add ingredients button
            ingredients_btn = QPushButton("")
            ingredients_btn.setIcon(QIcon(os.path.join("Resources", "icons", "ingredients.png")))
            ingredients_btn.setFixedSize(28, 28)
            ingredients_btn.setToolTip("Add Ingredients")
            ingredients_btn.clicked.connect(lambda checked, b_id=row['batch_id']: self.show_add_ingredient_dialog(b_id))
            action_layout.addWidget(ingredients_btn)
            
            # Update status button
            status_btn = QPushButton("")
            status_btn.setIcon(QIcon(os.path.join("Resources", "icons", "status.png")))
            status_btn.setFixedSize(28, 28)
            status_btn.setToolTip("Update Status")
            status_btn.clicked.connect(lambda checked, b_id=row['batch_id']: self.show_update_status_dialog(b_id))
            action_layout.addWidget(status_btn)
            
            # Quality test button
            test_btn = QPushButton("")
            test_btn.setIcon(QIcon(os.path.join("Resources", "icons", "test.png")))
            test_btn.setFixedSize(28, 28)
            test_btn.setToolTip("Add Quality Test")
            test_btn.clicked.connect(lambda checked, b_id=row['batch_id']: self.show_add_test_dialog(b_id))
            action_layout.addWidget(test_btn)
            
            action_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
            action_cell.setLayout(action_layout)
            
            self.batches_table.setCellWidget(row_position, 6, action_cell)
    
    def _apply_filters(self):
        """Apply filters to the batches table"""
        self.logger.info("Applying filters to production batches")
        
        try:
            # Get the original data
            batches_df = self.data_manager.get_production_batches()
            
            if batches_df.empty:
                return
            
            # Apply status filter
            status_filter = self.status_filter.currentText()
            if status_filter != "All Statuses":
                batches_df = batches_df[batches_df['status'] == status_filter]
            
            # Apply search filter
            search_text = self.search_input.text().strip().lower()
            if search_text:
                # Filter on batch_id or notes
                id_mask = batches_df['batch_id'].str.lower().str.contains(search_text, na=False)
                notes_mask = batches_df['notes'].astype(str).str.lower().str.contains(search_text, na=False)
                batches_df = batches_df[id_mask | notes_mask]
            
            # Apply date filter
            from_date = self.date_from.date().toString("yyyy-MM-dd")
            to_date = self.date_to.date().toString("yyyy-MM-dd")
            
            # Filter by creation_date
            batches_df = batches_df[(batches_df['creation_date'] >= from_date) & 
                                  (batches_df['creation_date'] <= to_date)]
            
            # Update the table with filtered data
            self._populate_batches_table(batches_df)
            
        except Exception as e:
            self.logger.error(f"Error applying filters: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to apply filters: {str(e)}")
    
    def handle_data_changed(self, data_type):
        """Handle data change notification from the data manager"""
        if data_type in ["production_batches", "batch_ingredients", "quality_control"]:
            self._load_data()
    
    def show_new_batch_dialog(self):
        """Show dialog to create a new production batch"""
        self.logger.info("Showing new batch dialog")
        
        dialog = QDialog(self)
        dialog.setWindowTitle("Create New Production Batch")
        dialog.setMinimumWidth(400)
        
        layout = QFormLayout()
        
        # Batch ID
        batch_id = f"B{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        batch_id_field = QLineEdit(batch_id)
        batch_id_field.setReadOnly(True)
        layout.addRow("Batch ID:", batch_id_field)
        
        # Creation date
        date_field = QDateEdit()
        date_field.setDate(QDate.currentDate())
        date_field.setCalendarPopup(True)
        layout.addRow("Creation Date:", date_field)
        
        # Quantity
        quantity_field = QDoubleSpinBox()
        quantity_field.setMinimum(0.1)
        quantity_field.setMaximum(10000.0)
        quantity_field.setSuffix(" kg")
        quantity_field.setValue(100.0)
        layout.addRow("Production Quantity:", quantity_field)
        
        # Notes
        notes_field = QTextEdit()
        notes_field.setMaximumHeight(100)
        layout.addRow("Notes:", notes_field)
        
        # Status
        status_field = QComboBox()
        status_field.addItems(["In Progress", "On Hold"])
        layout.addRow("Initial Status:", status_field)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        create_btn = QPushButton("Create Batch")
        create_btn.clicked.connect(lambda: self._create_batch(
            batch_id_field.text(),
            date_field.date().toString("yyyy-MM-dd"),
            quantity_field.value(),
            notes_field.toPlainText(),
            status_field.currentText(),
            dialog
        ))
        buttons_layout.addWidget(create_btn)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(dialog.reject)
        buttons_layout.addWidget(cancel_btn)
        
        layout.addRow("", buttons_layout)
        dialog.setLayout(layout)
        
        dialog.exec()
    
    def _create_batch(self, batch_id, creation_date, quantity, notes, status, dialog):
        """Create a new production batch"""
        self.logger.info(f"Creating new batch: {batch_id}")
        
        try:
            success = self.data_manager.add_production_batch(
                batch_id, creation_date, quantity, status, notes
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Production batch {batch_id} created successfully."
                )
                dialog.accept()
                self._load_data()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to create production batch."
                )
        except Exception as e:
            self.logger.error(f"Error creating batch: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to create production batch: {str(e)}"
            )
    
    def show_add_ingredient_dialog(self, batch_id):
        """Show dialog to add ingredients to a batch"""
        self.logger.info(f"Showing add ingredient dialog for batch: {batch_id}")
        
        dialog = QDialog(self)
        dialog.setWindowTitle(f"Add Ingredient to Batch {batch_id}")
        dialog.setMinimumWidth(400)
        
        layout = QFormLayout()
        
        # Get products for ingredient selection
        try:
            products_df = self.data_manager.get_products()
            
            if products_df.empty:
                QMessageBox.warning(
                    self, "Warning", "No products available to add as ingredients."
                )
                return
            
            # Ingredient
            ingredient_field = QComboBox()
            for idx, row in products_df.iterrows():
                ingredient_field.addItem(f"{row['name']} ({row['product_id']})", row['product_id'])
            layout.addRow("Ingredient:", ingredient_field)
            
            # Quantity
            quantity_field = QDoubleSpinBox()
            quantity_field.setMinimum(0.1)
            quantity_field.setMaximum(10000.0)
            quantity_field.setValue(10.0)
            layout.addRow("Quantity:", quantity_field)
            
            # Unit
            unit_field = QComboBox()
            unit_field.addItems(["kg", "g", "L", "mL"])
            layout.addRow("Unit:", unit_field)
            
            # Buttons
            buttons_layout = QHBoxLayout()
            add_btn = QPushButton("Add Ingredient")
            add_btn.clicked.connect(lambda: self._add_ingredient(
                batch_id,
                ingredient_field.currentData(),
                quantity_field.value(),
                unit_field.currentText(),
                dialog
            ))
            buttons_layout.addWidget(add_btn)
            
            cancel_btn = QPushButton("Cancel")
            cancel_btn.clicked.connect(dialog.reject)
            buttons_layout.addWidget(cancel_btn)
            
            layout.addRow("", buttons_layout)
            dialog.setLayout(layout)
            
            dialog.exec()
            
        except Exception as e:
            self.logger.error(f"Error preparing ingredient dialog: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to prepare ingredient dialog: {str(e)}"
            )
    
    def _add_ingredient(self, batch_id, ingredient_id, quantity, unit, dialog):
        """Add an ingredient to a batch"""
        self.logger.info(f"Adding ingredient {ingredient_id} to batch {batch_id}")
        
        try:
            success = self.data_manager.add_batch_ingredient(
                batch_id, ingredient_id, quantity, unit
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Ingredient added successfully to batch {batch_id}."
                )
                dialog.accept()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to add ingredient to batch."
                )
        except Exception as e:
            self.logger.error(f"Error adding ingredient: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to add ingredient: {str(e)}"
            )
    
    def show_update_status_dialog(self, batch_id):
        """Show dialog to update batch status"""
        self.logger.info(f"Showing update status dialog for batch: {batch_id}")
        
        dialog = QDialog(self)
        dialog.setWindowTitle(f"Update Status for Batch {batch_id}")
        dialog.setMinimumWidth(400)
        
        layout = QFormLayout()
        
        # Status
        status_field = QComboBox()
        status_field.addItems(["In Progress", "Completed", "On Hold", "Cancelled"])
        layout.addRow("New Status:", status_field)
        
        # Completion date (only shown if status is "Completed")
        date_field = QDateEdit()
        date_field.setDate(QDate.currentDate())
        date_field.setCalendarPopup(True)
        date_label = QLabel("Completion Date:")
        layout.addRow(date_label, date_field)
        
        def on_status_changed():
            # Show/hide completion date based on status
            is_completed = status_field.currentText() == "Completed"
            date_label.setVisible(is_completed)
            date_field.setVisible(is_completed)
        
        status_field.currentTextChanged.connect(on_status_changed)
        on_status_changed()  # Initial state
        
        # Buttons
        buttons_layout = QHBoxLayout()
        update_btn = QPushButton("Update Status")
        update_btn.clicked.connect(lambda: self._update_batch_status(
            batch_id,
            status_field.currentText(),
            date_field.date().toString("yyyy-MM-dd") if status_field.currentText() == "Completed" else None,
            dialog
        ))
        buttons_layout.addWidget(update_btn)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(dialog.reject)
        buttons_layout.addWidget(cancel_btn)
        
        layout.addRow("", buttons_layout)
        dialog.setLayout(layout)
        
        dialog.exec()
    
    def _update_batch_status(self, batch_id, status, completion_date, dialog):
        """Update the status of a batch"""
        self.logger.info(f"Updating batch {batch_id} status to {status}")
        
        try:
            success = self.data_manager.update_batch_status(
                batch_id, status, completion_date
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Batch {batch_id} status updated to {status}."
                )
                dialog.accept()
                self._load_data()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to update batch status."
                )
        except Exception as e:
            self.logger.error(f"Error updating batch status: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to update batch status: {str(e)}"
            )
    
    def show_add_test_dialog(self, batch_id):
        """Show dialog to add a quality test to a batch"""
        self.logger.info(f"Showing add test dialog for batch: {batch_id}")
        
        dialog = QDialog(self)
        dialog.setWindowTitle(f"Add Quality Test for Batch {batch_id}")
        dialog.setMinimumWidth(450)
        
        layout = QFormLayout()
        
        # Test date
        date_field = QDateEdit()
        date_field.setDate(QDate.currentDate())
        date_field.setCalendarPopup(True)
        layout.addRow("Test Date:", date_field)
        
        # Test type
        test_type_field = QComboBox()
        test_type_field.addItems([
            "Mineral Content", "Salt Concentration", "Moisture Level", 
            "Binding Quality", "Visual Inspection", "Other"
        ])
        layout.addRow("Test Type:", test_type_field)
        
        # Test result
        result_field = QLineEdit()
        layout.addRow("Test Result:", result_field)
        
        # Pass/Fail
        pass_fail_field = QComboBox()
        pass_fail_field.addItems(["Pass", "Fail"])
        layout.addRow("Pass/Fail:", pass_fail_field)
        
        # Tested by
        tested_by_field = QLineEdit()
        layout.addRow("Tested By:", tested_by_field)
        
        # Notes
        notes_field = QTextEdit()
        notes_field.setMaximumHeight(100)
        layout.addRow("Notes:", notes_field)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        add_btn = QPushButton("Add Test")
        add_btn.clicked.connect(lambda: self._add_quality_test(
            batch_id,
            date_field.date().toString("yyyy-MM-dd"),
            test_type_field.currentText(),
            result_field.text(),
            pass_fail_field.currentText(),
            tested_by_field.text(),
            notes_field.toPlainText(),
            dialog
        ))
        buttons_layout.addWidget(add_btn)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(dialog.reject)
        buttons_layout.addWidget(cancel_btn)
        
        layout.addRow("", buttons_layout)
        dialog.setLayout(layout)
        
        dialog.exec()
    
    def _add_quality_test(self, batch_id, test_date, test_type, test_result, pass_fail, tested_by, notes, dialog):
        """Add a quality test to a batch"""
        self.logger.info(f"Adding quality test for batch {batch_id}")
        
        # Validate input
        if not test_result:
            QMessageBox.warning(self, "Validation Error", "Test result cannot be empty.")
            return
        
        if not tested_by:
            QMessageBox.warning(self, "Validation Error", "Tested By cannot be empty.")
            return
        
        try:
            success = self.data_manager.add_quality_test(
                batch_id, test_date, test_type, test_result, pass_fail, tested_by, notes
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Quality test added successfully to batch {batch_id}."
                )
                dialog.accept()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to add quality test."
                )
        except Exception as e:
            self.logger.error(f"Error adding quality test: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to add quality test: {str(e)}"
            )
    
    def view_batch_details(self, batch_id):
        """View details of a specific batch"""
        self.logger.info(f"Viewing details for batch: {batch_id}")
        
        try:
            batch_details = self.data_manager.get_batch_details(batch_id)
            
            if batch_details["batch"].empty:
                QMessageBox.warning(
                    self, "Warning", f"No details found for batch {batch_id}."
                )
                return
            
            # Create and show batch detail dialog
            dialog = QDialog(self)
            dialog.setWindowTitle(f"Batch Details: {batch_id}")
            dialog.setMinimumSize(700, 500)
            
            main_layout = QVBoxLayout()
            
            # Batch info
            batch_info = batch_details["batch"].iloc[0]
            
            info_group = QGroupBox("Batch Information")
            info_layout = QFormLayout()
            
            info_layout.addRow("Batch ID:", QLabel(batch_id))
            info_layout.addRow("Creation Date:", QLabel(batch_info["creation_date"]))
            info_layout.addRow("Status:", QLabel(batch_info["status"]))
            info_layout.addRow("Production Quantity:", QLabel(f"{batch_info['production_quantity']} kg"))
            
            if pd.notna(batch_info["completion_date"]):
                info_layout.addRow("Completion Date:", QLabel(batch_info["completion_date"]))
                
            if pd.notna(batch_info["notes"]):
                notes_label = QLabel(batch_info["notes"])
                notes_label.setWordWrap(True)
                info_layout.addRow("Notes:", notes_label)
                
            info_group.setLayout(info_layout)
            main_layout.addWidget(info_group)
            
            # Tabs for ingredients and quality tests
            tabs = QTabWidget()
            
            # Ingredients tab
            ingredients_tab = QWidget()
            ingredients_layout = QVBoxLayout()
            
            ingredients_table = QTableWidget()
            ingredients_table.setColumnCount(4)
            ingredients_table.setHorizontalHeaderLabels([
                "Ingredient", "Ingredient ID", "Quantity", "Unit"
            ])
            ingredients_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
            ingredients_table.verticalHeader().setVisible(False)
            
            ingredients_df = batch_details["ingredients"]
            if not ingredients_df.empty:
                ingredients_table.setRowCount(len(ingredients_df))
                
                for idx, row in ingredients_df.iterrows():
                    ingredients_table.setItem(idx, 0, QTableWidgetItem(row.get("ingredient_name", "Unknown")))
                    ingredients_table.setItem(idx, 1, QTableWidgetItem(row["ingredient_id"]))
                    ingredients_table.setItem(idx, 2, QTableWidgetItem(str(row["quantity"])))
                    ingredients_table.setItem(idx, 3, QTableWidgetItem(row["unit"]))
            
            ingredients_layout.addWidget(ingredients_table)
            ingredients_tab.setLayout(ingredients_layout)
            tabs.addTab(ingredients_tab, "Ingredients")
            
            # Quality tests tab
            tests_tab = QWidget()
            tests_layout = QVBoxLayout()
            
            tests_table = QTableWidget()
            tests_table.setColumnCount(7)
            tests_table.setHorizontalHeaderLabels([
                "Test Date", "Test Type", "Result", "Pass/Fail", 
                "Tested By", "Notes", "ID"
            ])
            tests_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
            tests_table.verticalHeader().setVisible(False)
            
            tests_df = batch_details["quality_tests"]
            if not tests_df.empty:
                tests_table.setRowCount(len(tests_df))
                
                for idx, row in tests_df.iterrows():
                    tests_table.setItem(idx, 0, QTableWidgetItem(row["test_date"]))
                    tests_table.setItem(idx, 1, QTableWidgetItem(row["test_type"]))
                    tests_table.setItem(idx, 2, QTableWidgetItem(row["test_result"]))
                    
                    pass_fail_item = QTableWidgetItem(row["pass_fail"])
                    if row["pass_fail"] == "Pass":
                        pass_fail_item.setBackground(QColor("#C8E6C9"))  # Light green
                    else:
                        pass_fail_item.setBackground(QColor("#FFCDD2"))  # Light red
                    tests_table.setItem(idx, 3, pass_fail_item)
                    
                    tests_table.setItem(idx, 4, QTableWidgetItem(row["tested_by"]))
                    tests_table.setItem(idx, 5, QTableWidgetItem(row["notes"] if pd.notna(row["notes"]) else ""))
                    tests_table.setItem(idx, 6, QTableWidgetItem(str(row["id"])))
            
            tests_layout.addWidget(tests_table)
            tests_tab.setLayout(tests_layout)
            tabs.addTab(tests_tab, "Quality Tests")
            
            main_layout.addWidget(tabs)
            
            # Close button
            close_btn = QPushButton("Close")
            close_btn.clicked.connect(dialog.accept)
            main_layout.addWidget(close_btn, alignment=Qt.AlignmentFlag.AlignRight)
            
            dialog.setLayout(main_layout)
            dialog.exec()
            
        except Exception as e:
            self.logger.error(f"Error viewing batch details: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to load batch details: {str(e)}"
            ) 