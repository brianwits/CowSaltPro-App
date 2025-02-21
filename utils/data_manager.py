import pandas as pd
import os
from datetime import datetime

class DataManager:
    def __init__(self):
        self.data_dir = "data"
        self.ensure_data_files_exist()

    def ensure_data_files_exist(self):
        """Create data files if they don't exist"""
        os.makedirs(self.data_dir, exist_ok=True)

        # Initialize products.csv
        if not os.path.exists(f"{self.data_dir}/products.csv"):
            pd.DataFrame({
                'product_id': [],
                'name': [],
                'price': [],
                'reorder_level': []
            }).to_csv(f"{self.data_dir}/products.csv", index=False)

        # Initialize transactions.csv
        if not os.path.exists(f"{self.data_dir}/transactions.csv"):
            pd.DataFrame({
                'transaction_id': [],
                'date': [],
                'product_id': [],
                'quantity': [],
                'type': [],
                'amount': []
            }).to_csv(f"{self.data_dir}/transactions.csv", index=False)

        # Initialize inventory.csv
        if not os.path.exists(f"{self.data_dir}/inventory.csv"):
            pd.DataFrame({
                'product_id': [],
                'quantity': [],
                'last_updated': []
            }).to_csv(f"{self.data_dir}/inventory.csv", index=False)

        # Initialize cashbook.csv
        if not os.path.exists(f"{self.data_dir}/cashbook.csv"):
            pd.DataFrame({
                'date': [],
                'description': [],
                'type': [],
                'amount': [],
                'payment_method': []
            }).to_csv(f"{self.data_dir}/cashbook.csv", index=False)

    def get_products(self):
        """Get all products"""
        try:
            return pd.read_csv(f"{self.data_dir}/products.csv")
        except Exception as e:
            st.error(f"Error reading products: {str(e)}")
            return pd.DataFrame()

    def get_transactions(self):
        """Get all transactions"""
        try:
            return pd.read_csv(f"{self.data_dir}/transactions.csv")
        except Exception as e:
            st.error(f"Error reading transactions: {str(e)}")
            return pd.DataFrame()

    def get_inventory(self):
        """Get current inventory"""
        try:
            return pd.read_csv(f"{self.data_dir}/inventory.csv")
        except Exception as e:
            st.error(f"Error reading inventory: {str(e)}")
            return pd.DataFrame()

    def get_cashbook(self):
        """Get cashbook entries"""
        try:
            return pd.read_csv(f"{self.data_dir}/cashbook.csv")
        except Exception as e:
            st.error(f"Error reading cashbook: {str(e)}")
            return pd.DataFrame()

    def add_transaction(self, product_id, quantity, type_of_transaction, amount):
        transactions = self.get_transactions()
        new_transaction = pd.DataFrame({
            'transaction_id': [len(transactions) + 1],
            'date': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            'product_id': [product_id],
            'quantity': [quantity],
            'type': [type_of_transaction],
            'amount': [amount]
        })
        transactions = pd.concat([transactions, new_transaction], ignore_index=True)
        transactions.to_csv(f"{self.data_dir}/transactions.csv", index=False)

    def update_inventory(self, product_id, quantity_change):
        inventory = self.get_inventory()
        if product_id in inventory['product_id'].values:
            inventory.loc[inventory['product_id'] == product_id, 'quantity'] += quantity_change
        else:
            new_item = pd.DataFrame({
                'product_id': [product_id],
                'quantity': [quantity_change],
                'last_updated': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
            })
            inventory = pd.concat([inventory, new_item], ignore_index=True)
        inventory.to_csv(f"{self.data_dir}/inventory.csv", index=False)

    def add_cashbook_entry(self, description, type_of_entry, amount, payment_method):
        cashbook = self.get_cashbook()
        new_entry = pd.DataFrame({
            'date': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            'description': [description],
            'type': [type_of_entry],
            'amount': [amount],
            'payment_method': [payment_method]
        })
        cashbook = pd.concat([cashbook, new_entry], ignore_index=True)
        cashbook.to_csv(f"{self.data_dir}/cashbook.csv", index=False)