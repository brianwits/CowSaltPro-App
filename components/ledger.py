import streamlit as st
import pandas as pd
from utils.data_manager import DataManager

def show_ledger():
    st.header("Stores Ledger")
    
    data_manager = DataManager()
    
    # Tabs for different ledger functions
    tab1, tab2, tab3 = st.tabs(["Transaction History", "New Transaction", "Reports"])
    
    with tab1:
        st.subheader("Transaction History")
        transactions = data_manager.get_transactions()
        if not transactions.empty:
            st.dataframe(transactions)
        else:
            st.info("No transactions recorded yet")
    
    with tab2:
        st.subheader("Record New Transaction")
        products = data_manager.get_products()
        
        with st.form("new_transaction"):
            product_id = st.selectbox("Select Product", products['product_id'])
            quantity = st.number_input("Quantity", min_value=1)
            transaction_type = st.selectbox("Transaction Type", ["Sale", "Purchase", "Return"])
            amount = st.number_input("Amount", min_value=0.0)
            
            if st.form_submit_button("Record Transaction"):
                try:
                    data_manager.add_transaction(product_id, quantity, transaction_type, amount)
                    if transaction_type == "Sale":
                        data_manager.update_inventory(product_id, -quantity)
                    elif transaction_type == "Purchase":
                        data_manager.update_inventory(product_id, quantity)
                    st.success("Transaction recorded successfully!")
                except Exception as e:
                    st.error(f"Error recording transaction: {str(e)}")
    
    with tab3:
        st.subheader("Transaction Reports")
        
        # Date range selector
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("Start Date")
        with col2:
            end_date = st.date_input("End Date")
        
        if st.button("Generate Report"):
            transactions = data_manager.get_transactions()
            if not transactions.empty:
                # Filter by date range
                transactions['date'] = pd.to_datetime(transactions['date'])
                mask = (transactions['date'].dt.date >= start_date) & (transactions['date'].dt.date <= end_date)
                filtered_transactions = transactions.loc[mask]
                
                # Display summary statistics
                st.write("Summary Statistics")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Sales", f"KES {filtered_transactions[filtered_transactions['type'] == 'Sale']['amount'].sum():,.2f}")
                with col2:
                    st.metric("Total Purchases", f"KES {filtered_transactions[filtered_transactions['type'] == 'Purchase']['amount'].sum():,.2f}")
                with col3:
                    st.metric("Number of Transactions", len(filtered_transactions))
                
                # Display detailed report
                st.write("Detailed Report")
                st.dataframe(filtered_transactions)
