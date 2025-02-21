import streamlit as st
import pandas as pd
import plotly.express as px
from utils.data_manager import DataManager

def show_cashbook():
    st.header("Cash Book")
    
    data_manager = DataManager()
    
    # Tabs for different cashbook functions
    tab1, tab2, tab3 = st.tabs(["Cash Transactions", "New Entry", "Reports"])
    
    with tab1:
        st.subheader("Cash Transactions")
        cashbook = data_manager.get_cashbook()
        if not cashbook.empty:
            st.dataframe(cashbook)
        else:
            st.info("No cash transactions recorded yet")
    
    with tab2:
        st.subheader("New Cash Entry")
        
        with st.form("new_cash_entry"):
            description = st.text_input("Description")
            entry_type = st.selectbox("Entry Type", ["Income", "Expense"])
            amount = st.number_input("Amount", min_value=0.0)
            payment_method = st.selectbox("Payment Method", ["Cash", "M-PESA", "Bank Transfer"])
            
            if st.form_submit_button("Record Entry"):
                try:
                    data_manager.add_cashbook_entry(description, entry_type, amount, payment_method)
                    st.success("Cash entry recorded successfully!")
                except Exception as e:
                    st.error(f"Error recording cash entry: {str(e)}")
    
    with tab3:
        st.subheader("Cash Book Reports")
        
        # Date range selector
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("Start Date")
        with col2:
            end_date = st.date_input("End Date")
        
        if st.button("Generate Report"):
            cashbook = data_manager.get_cashbook()
            if not cashbook.empty:
                # Filter by date range
                cashbook['date'] = pd.to_datetime(cashbook['date'])
                mask = (cashbook['date'].dt.date >= start_date) & (cashbook['date'].dt.date <= end_date)
                filtered_cashbook = cashbook.loc[mask]
                
                # Display summary statistics
                st.write("Summary Statistics")
                col1, col2, col3 = st.columns(3)
                
                total_income = filtered_cashbook[filtered_cashbook['type'] == 'Income']['amount'].sum()
                total_expense = filtered_cashbook[filtered_cashbook['type'] == 'Expense']['amount'].sum()
                balance = total_income - total_expense
                
                with col1:
                    st.metric("Total Income", f"KES {total_income:,.2f}")
                with col2:
                    st.metric("Total Expenses", f"KES {total_expense:,.2f}")
                with col3:
                    st.metric("Balance", f"KES {balance:,.2f}")
                
                # Create charts
                fig = px.pie(filtered_cashbook, values='amount', names='type',
                           title='Income vs Expenses')
                st.plotly_chart(fig)
                
                # Payment method breakdown
                payment_summary = filtered_cashbook.groupby('payment_method')['amount'].sum()
                fig2 = px.bar(payment_summary, title='Payment Method Distribution')
                st.plotly_chart(fig2)
