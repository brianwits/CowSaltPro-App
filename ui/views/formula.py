import os
import pandas as pd
import uuid
from datetime import datetime

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QTableWidget, 
    QTableWidgetItem, QComboBox, QLineEdit, QDateEdit, QTextEdit, QSpinBox, 
    QDoubleSpinBox, QMessageBox, QDialog, QFormLayout, QTabWidget,
    QGroupBox, QHeaderView, QScrollArea, QFrame, QCheckBox
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QDate
from PyQt6.QtGui import QIcon, QColor, QFont

from ui.utils.logger import get_logger
from ui.utils.responsive import ResponsiveHelper
from ui.widgets.custom_widgets import (
    FilterHeader, InfoCard, ConfirmDialog
)

class FormulaView(QWidget):
    """
    View for managing salt mix formulas and their ingredients
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
        """Set up the formula management user interface"""
        main_layout = QVBoxLayout()
        
        # Header section
        header_layout = QHBoxLayout()
        self.title_label = QLabel("Formula Management")
        self.title_label.setObjectName("viewTitle")
        header_layout.addWidget(self.title_label)
        
        self.new_formula_btn = QPushButton("New Formula")
        self.new_formula_btn.setIcon(QIcon(os.path.join("Resources", "icons", "add.png")))
        self.new_formula_btn.clicked.connect(self.show_new_formula_dialog)
        header_layout.addWidget(self.new_formula_btn)
        
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
        
        self.active_formula_card = InfoCard(
            title="Active Formulas", 
            value="0",
            icon=os.path.join("Resources", "icons", "formula_active.png"),
            color="#4CAF50"
        )
        status_layout.addWidget(self.active_formula_card)
        
        self.inactive_formula_card = InfoCard(
            title="Inactive Formulas", 
            value="0",
            icon=os.path.join("Resources", "icons", "formula_inactive.png"),
            color="#F44336"
        )
        status_layout.addWidget(self.inactive_formula_card)
        
        self.formula_versions_card = InfoCard(
            title="Formula Versions", 
            value="0",
            icon=os.path.join("Resources", "icons", "versions.png"),
            color="#2196F3"
        )
        status_layout.addWidget(self.formula_versions_card)
        
        self.ingredient_count_card = InfoCard(
            title="Unique Ingredients", 
            value="0",
            icon=os.path.join("Resources", "icons", "ingredients.png"),
            color="#FFC107"
        )
        status_layout.addWidget(self.ingredient_count_card)
        
        main_layout.addLayout(status_layout)
        
        # Formulas table
        self.formulas_group = QGroupBox("Salt Mix Formulas")
        formulas_layout = QVBoxLayout()
        
        # Filter section
        filter_layout = QHBoxLayout()
        
        self.status_filter = QComboBox()
        self.status_filter.addItem("All Formulas")
        self.status_filter.addItem("Active Only")
        self.status_filter.addItem("Inactive Only")
        self.status_filter.currentTextChanged.connect(self._apply_filters)
        filter_layout.addWidget(QLabel("Status:"))
        filter_layout.addWidget(self.status_filter)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by formula name or ID...")
        self.search_input.textChanged.connect(self._apply_filters)
        filter_layout.addWidget(QLabel("Search:"))
        filter_layout.addWidget(self.search_input)
        
        formulas_layout.addLayout(filter_layout)
        
        # Formulas table
        self.formulas_table = QTableWidget()
        self.formulas_table.setColumnCount(7)
        self.formulas_table.setHorizontalHeaderLabels([
            "Formula ID", "Name", "Version", "Created", 
            "Last Modified", "Status", "Actions"
        ])
        self.formulas_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.formulas_table.horizontalHeader().setSectionResizeMode(6, QHeaderView.ResizeMode.ResizeToContents)
        self.formulas_table.verticalHeader().setVisible(False)
        self.formulas_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        
        formulas_layout.addWidget(self.formulas_table)
        
        self.formulas_group.setLayout(formulas_layout)
        main_layout.addWidget(self.formulas_group)
        
        self.setLayout(main_layout)
    
    def _load_data(self):
        """Load formula data from the database"""
        self.logger.info("Loading formula data")
        
        try:
            # Get all formulas (active and inactive)
            formulas_df = self.data_manager.get_formulas(active_only=False)
            
            # Update summary cards
            if not formulas_df.empty:
                active_count = len(formulas_df[formulas_df['is_active'] == 1])
                inactive_count = len(formulas_df[formulas_df['is_active'] == 0])
                
                self.active_formula_card.set_value(str(active_count))
                self.inactive_formula_card.set_value(str(inactive_count))
                
                # Count unique formula names (ignoring versions)
                unique_names = formulas_df['name'].nunique()
                self.formula_versions_card.set_value(str(unique_names))
                
                # Get unique ingredients
                try:
                    conn = self.data_manager._get_connection()
                    cursor = conn.cursor()
                    cursor.execute("SELECT COUNT(DISTINCT ingredient_id) FROM formula_ingredients")
                    unique_ingredients = cursor.fetchone()[0]
                    conn.close()
                    
                    self.ingredient_count_card.set_value(str(unique_ingredients))
                except Exception as e:
                    self.logger.error(f"Error counting ingredients: {str(e)}", exc_info=True)
                    self.ingredient_count_card.set_value("N/A")
            
            # Display in table
            self._populate_formulas_table(formulas_df)
        
        except Exception as e:
            self.logger.error(f"Error loading formula data: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to load formula data: {str(e)}")
    
    def _populate_formulas_table(self, formulas_df):
        """Populate the formulas table with data"""
        self.formulas_table.setRowCount(0)
        
        if formulas_df.empty:
            self.logger.info("No formulas found")
            return
        
        for idx, row in formulas_df.iterrows():
            row_position = self.formulas_table.rowCount()
            self.formulas_table.insertRow(row_position)
            
            # Formula ID
            self.formulas_table.setItem(row_position, 0, QTableWidgetItem(row['formula_id']))
            
            # Name
            self.formulas_table.setItem(row_position, 1, QTableWidgetItem(row['name']))
            
            # Version
            self.formulas_table.setItem(row_position, 2, QTableWidgetItem(row['version']))
            
            # Created Date
            self.formulas_table.setItem(row_position, 3, QTableWidgetItem(row['created_date']))
            
            # Last Modified
            self.formulas_table.setItem(row_position, 4, QTableWidgetItem(row['last_modified']))
            
            # Status with color coding
            status_text = "Active" if row['is_active'] == 1 else "Inactive"
            status_item = QTableWidgetItem(status_text)
            if row['is_active'] == 1:
                status_item.setBackground(QColor("#C8E6C9"))  # Light green
            else:
                status_item.setBackground(QColor("#FFCDD2"))  # Light red
            self.formulas_table.setItem(row_position, 5, status_item)
            
            # Action buttons
            action_cell = QWidget()
            action_layout = QHBoxLayout(action_cell)
            action_layout.setContentsMargins(2, 2, 2, 2)
            action_layout.setSpacing(4)
            
            # View details button
            view_btn = QPushButton("")
            view_btn.setIcon(QIcon(os.path.join("Resources", "icons", "view.png")))
            view_btn.setFixedSize(28, 28)
            view_btn.setToolTip("View Formula Details")
            view_btn.clicked.connect(lambda checked, f_id=row['formula_id']: self.view_formula_details(f_id))
            action_layout.addWidget(view_btn)
            
            # Add ingredient button
            ingredients_btn = QPushButton("")
            ingredients_btn.setIcon(QIcon(os.path.join("Resources", "icons", "ingredients.png")))
            ingredients_btn.setFixedSize(28, 28)
            ingredients_btn.setToolTip("Add Ingredient")
            ingredients_btn.clicked.connect(lambda checked, f_id=row['formula_id']: self.show_add_ingredient_dialog(f_id))
            action_layout.addWidget(ingredients_btn)
            
            # Toggle active status button
            toggle_icon = "activate.png" if row['is_active'] == 0 else "deactivate.png"
            toggle_btn = QPushButton("")
            toggle_btn.setIcon(QIcon(os.path.join("Resources", "icons", toggle_icon)))
            toggle_btn.setFixedSize(28, 28)
            toggle_btn.setToolTip("Toggle Active Status")
            toggle_btn.clicked.connect(lambda checked, f_id=row['formula_id'], status=row['is_active']: 
                                      self.toggle_formula_status(f_id, status))
            action_layout.addWidget(toggle_btn)
            
            # Create new version button
            version_btn = QPushButton("")
            version_btn.setIcon(QIcon(os.path.join("Resources", "icons", "new_version.png")))
            version_btn.setFixedSize(28, 28)
            version_btn.setToolTip("Create New Version")
            version_btn.clicked.connect(lambda checked, f_id=row['formula_id'], name=row['name'], 
                                       ver=row['version']: self.create_new_version(f_id, name, ver))
            action_layout.addWidget(version_btn)
            
            action_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
            action_cell.setLayout(action_layout)
            
            self.formulas_table.setCellWidget(row_position, 6, action_cell)
    
    def _apply_filters(self):
        """Apply filters to the formulas table"""
        self.logger.info("Applying filters to formulas")
        
        try:
            # Get all formulas
            formulas_df = self.data_manager.get_formulas(active_only=False)
            
            if formulas_df.empty:
                return
            
            # Apply status filter
            status_filter = self.status_filter.currentText()
            if status_filter == "Active Only":
                formulas_df = formulas_df[formulas_df['is_active'] == 1]
            elif status_filter == "Inactive Only":
                formulas_df = formulas_df[formulas_df['is_active'] == 0]
            
            # Apply search filter
            search_text = self.search_input.text().strip().lower()
            if search_text:
                # Filter on name or formula_id
                name_mask = formulas_df['name'].str.lower().str.contains(search_text, na=False)
                id_mask = formulas_df['formula_id'].str.lower().str.contains(search_text, na=False)
                formulas_df = formulas_df[name_mask | id_mask]
            
            # Update the table with filtered data
            self._populate_formulas_table(formulas_df)
            
        except Exception as e:
            self.logger.error(f"Error applying filters: {str(e)}", exc_info=True)
            QMessageBox.critical(self, "Error", f"Failed to apply filters: {str(e)}")
    
    def handle_data_changed(self, data_type):
        """Handle data change notification from the data manager"""
        if data_type in ["formulas", "formula_ingredients"]:
            self._load_data()
    
    def show_new_formula_dialog(self):
        """Show dialog to create a new formula"""
        self.logger.info("Showing new formula dialog")
        
        dialog = QDialog(self)
        dialog.setWindowTitle("Create New Formula")
        dialog.setMinimumWidth(400)
        
        layout = QFormLayout()
        
        # Formula ID
        formula_id = f"F{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        formula_id_field = QLineEdit(formula_id)
        formula_id_field.setReadOnly(True)
        layout.addRow("Formula ID:", formula_id_field)
        
        # Name
        name_field = QLineEdit()
        name_field.setPlaceholderText("Enter formula name")
        layout.addRow("Formula Name:", name_field)
        
        # Version
        version_field = QLineEdit("1.0")
        layout.addRow("Version:", version_field)
        
        # Description
        description_field = QTextEdit()
        description_field.setMaximumHeight(100)
        layout.addRow("Description:", description_field)
        
        # Is Active
        is_active_field = QCheckBox("Formula is active")
        is_active_field.setChecked(True)
        layout.addRow("Status:", is_active_field)
        
        # Created date
        date_field = QDateEdit()
        date_field.setDate(QDate.currentDate())
        date_field.setCalendarPopup(True)
        layout.addRow("Creation Date:", date_field)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        create_btn = QPushButton("Create Formula")
        create_btn.clicked.connect(lambda: self._create_formula(
            formula_id_field.text(),
            name_field.text(),
            description_field.toPlainText(),
            date_field.date().toString("yyyy-MM-dd"),
            version_field.text(),
            1 if is_active_field.isChecked() else 0,
            dialog
        ))
        buttons_layout.addWidget(create_btn)
        
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(dialog.reject)
        buttons_layout.addWidget(cancel_btn)
        
        layout.addRow("", buttons_layout)
        dialog.setLayout(layout)
        
        dialog.exec()
    
    def _create_formula(self, formula_id, name, description, created_date, version, is_active, dialog):
        """Create a new formula"""
        self.logger.info(f"Creating new formula: {name}")
        
        # Validate input
        if not name:
            QMessageBox.warning(self, "Validation Error", "Formula name cannot be empty.")
            return
        
        if not version:
            QMessageBox.warning(self, "Validation Error", "Version cannot be empty.")
            return
        
        try:
            success = self.data_manager.add_formula(
                formula_id, name, description, created_date, version, is_active
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Formula '{name}' created successfully."
                )
                dialog.accept()
                self._load_data()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to create formula."
                )
        except Exception as e:
            self.logger.error(f"Error creating formula: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to create formula: {str(e)}"
            )
    
    def show_add_ingredient_dialog(self, formula_id):
        """Show dialog to add ingredients to a formula"""
        self.logger.info(f"Showing add ingredient dialog for formula: {formula_id}")
        
        dialog = QDialog(self)
        dialog.setWindowTitle(f"Add Ingredient to Formula {formula_id}")
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
            unit_field.addItems(["kg", "g", "L", "mL", "%"])
            layout.addRow("Unit:", unit_field)
            
            # Buttons
            buttons_layout = QHBoxLayout()
            add_btn = QPushButton("Add Ingredient")
            add_btn.clicked.connect(lambda: self._add_formula_ingredient(
                formula_id,
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
    
    def _add_formula_ingredient(self, formula_id, ingredient_id, quantity, unit, dialog):
        """Add an ingredient to a formula"""
        self.logger.info(f"Adding ingredient {ingredient_id} to formula {formula_id}")
        
        try:
            success = self.data_manager.add_formula_ingredient(
                formula_id, ingredient_id, quantity, unit
            )
            
            if success:
                QMessageBox.information(
                    self, "Success", f"Ingredient added successfully to formula {formula_id}."
                )
                dialog.accept()
            else:
                QMessageBox.warning(
                    self, "Warning", "Failed to add ingredient to formula."
                )
        except Exception as e:
            self.logger.error(f"Error adding formula ingredient: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to add ingredient: {str(e)}"
            )
    
    def toggle_formula_status(self, formula_id, current_status):
        """Toggle the active status of a formula"""
        self.logger.info(f"Toggling status for formula: {formula_id}")
        
        new_status = 0 if current_status == 1 else 1
        status_text = "Active" if new_status == 1 else "Inactive"
        
        try:
            # Open a connection
            conn = self.data_manager._get_connection()
            cursor = conn.cursor()
            
            # Update the formula status
            cursor.execute(
                "UPDATE formulas SET is_active = ?, last_modified = ? WHERE formula_id = ?",
                (new_status, datetime.now().strftime("%Y-%m-%d"), formula_id)
            )
            
            if cursor.rowcount <= 0:
                conn.rollback()
                conn.close()
                QMessageBox.warning(
                    self, "Warning", f"Failed to update formula status - formula {formula_id} not found."
                )
                return
            
            conn.commit()
            conn.close()
            
            QMessageBox.information(
                self, "Success", f"Formula status updated to {status_text}."
            )
            
            # Emit the data changed signal
            self.data_manager.data_changed.emit("formulas")
            
        except Exception as e:
            self.logger.error(f"Error toggling formula status: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to update formula status: {str(e)}"
            )
    
    def create_new_version(self, formula_id, name, current_version):
        """Create a new version of an existing formula"""
        self.logger.info(f"Creating new version of formula: {formula_id}")
        
        try:
            # Calculate new version number
            try:
                version_parts = current_version.split('.')
                new_version = f"{version_parts[0]}.{int(version_parts[1]) + 1}"
            except:
                # If version format is not as expected, just append .1
                new_version = f"{current_version}.1"
            
            # Show confirmation dialog
            confirm = QMessageBox.question(
                self, "Confirm New Version",
                f"Create new version {new_version} of formula '{name}'?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            
            if confirm == QMessageBox.StandardButton.Yes:
                # Get formula details
                formula_details = self.data_manager.get_formula_details(formula_id)
                
                if formula_details["formula"].empty:
                    QMessageBox.warning(
                        self, "Warning", f"No details found for formula {formula_id}."
                    )
                    return
                
                formula_info = formula_details["formula"].iloc[0]
                
                # Create new formula ID
                new_formula_id = f"F{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
                
                # Create new formula entry
                success = self.data_manager.add_formula(
                    new_formula_id,
                    name,
                    formula_info["description"],
                    datetime.now().strftime("%Y-%m-%d"),
                    new_version,
                    1  # Make the new version active
                )
                
                if not success:
                    QMessageBox.warning(
                        self, "Warning", "Failed to create new formula version."
                    )
                    return
                
                # Copy ingredients
                ingredients_df = formula_details["ingredients"]
                if not ingredients_df.empty:
                    for idx, row in ingredients_df.iterrows():
                        self.data_manager.add_formula_ingredient(
                            new_formula_id,
                            row["ingredient_id"],
                            row["quantity"],
                            row["unit"]
                        )
                
                # Make the old version inactive
                self.toggle_formula_status(formula_id, 1)
                
                QMessageBox.information(
                    self, "Success", 
                    f"New version {new_version} of formula '{name}' created successfully."
                )
                
                self._load_data()
                
        except Exception as e:
            self.logger.error(f"Error creating new formula version: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to create new formula version: {str(e)}"
            )
    
    def view_formula_details(self, formula_id):
        """View details of a specific formula"""
        self.logger.info(f"Viewing details for formula: {formula_id}")
        
        try:
            formula_details = self.data_manager.get_formula_details(formula_id)
            
            if formula_details["formula"].empty:
                QMessageBox.warning(
                    self, "Warning", f"No details found for formula {formula_id}."
                )
                return
            
            # Create and show formula detail dialog
            dialog = QDialog(self)
            formula_info = formula_details["formula"].iloc[0]
            dialog.setWindowTitle(f"Formula Details: {formula_info['name']} (v{formula_info['version']})")
            dialog.setMinimumSize(600, 400)
            
            main_layout = QVBoxLayout()
            
            # Formula information section
            info_group = QGroupBox("Formula Information")
            info_layout = QFormLayout()
            
            info_layout.addRow("Formula ID:", QLabel(formula_id))
            info_layout.addRow("Name:", QLabel(formula_info["name"]))
            info_layout.addRow("Version:", QLabel(formula_info["version"]))
            info_layout.addRow("Created:", QLabel(formula_info["created_date"]))
            info_layout.addRow("Last Modified:", QLabel(formula_info["last_modified"]))
            status_text = "Active" if formula_info["is_active"] == 1 else "Inactive"
            status_label = QLabel(status_text)
            status_label.setStyleSheet(
                f"color: {'green' if formula_info['is_active'] == 1 else 'red'}; font-weight: bold;"
            )
            info_layout.addRow("Status:", status_label)
            
            if pd.notna(formula_info["description"]) and formula_info["description"]:
                desc_label = QLabel(formula_info["description"])
                desc_label.setWordWrap(True)
                info_layout.addRow("Description:", desc_label)
            
            info_group.setLayout(info_layout)
            main_layout.addWidget(info_group)
            
            # Ingredients section
            ingredients_group = QGroupBox("Ingredients")
            ingredients_layout = QVBoxLayout()
            
            ingredients_table = QTableWidget()
            ingredients_table.setColumnCount(4)
            ingredients_table.setHorizontalHeaderLabels([
                "Ingredient", "Ingredient ID", "Quantity", "Unit"
            ])
            ingredients_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
            ingredients_table.verticalHeader().setVisible(False)
            
            ingredients_df = formula_details["ingredients"]
            if not ingredients_df.empty:
                ingredients_table.setRowCount(len(ingredients_df))
                
                for idx, row in ingredients_df.iterrows():
                    ingredients_table.setItem(idx, 0, QTableWidgetItem(row.get("ingredient_name", "Unknown")))
                    ingredients_table.setItem(idx, 1, QTableWidgetItem(row["ingredient_id"]))
                    ingredients_table.setItem(idx, 2, QTableWidgetItem(str(row["quantity"])))
                    ingredients_table.setItem(idx, 3, QTableWidgetItem(row["unit"]))
            
            ingredients_layout.addWidget(ingredients_table)
            
            # Add ingredient button
            add_ingredient_btn = QPushButton("Add Ingredient")
            add_ingredient_btn.setIcon(QIcon(os.path.join("Resources", "icons", "add.png")))
            add_ingredient_btn.clicked.connect(lambda: self.show_add_ingredient_dialog(formula_id))
            ingredients_layout.addWidget(add_ingredient_btn, alignment=Qt.AlignmentFlag.AlignRight)
            
            ingredients_group.setLayout(ingredients_layout)
            main_layout.addWidget(ingredients_group)
            
            # Close button
            close_btn = QPushButton("Close")
            close_btn.clicked.connect(dialog.accept)
            main_layout.addWidget(close_btn, alignment=Qt.AlignmentFlag.AlignRight)
            
            dialog.setLayout(main_layout)
            dialog.exec()
            
        except Exception as e:
            self.logger.error(f"Error viewing formula details: {str(e)}", exc_info=True)
            QMessageBox.critical(
                self, "Error", f"Failed to load formula details: {str(e)}"
            ) 