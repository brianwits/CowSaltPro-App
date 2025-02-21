import streamlit as st
import pandas as pd
from datetime import datetime
from utils.data_manager import DataManager

def show_payments():
    st.header("Payment Management")
    
    data_manager = DataManager()
    
    # Tabs for different payment functions
    tab1, tab2 = st.tabs(["New Payment", "Payment History"])
    
    with tab1:
        st.subheader("Process New Payment")
        
        with st.form("new_payment"):
            # Payment details
            amount = st.number_input("Amount", min_value=0.0)
            payment_method = st.selectbox("Payment Method", ["M-PESA", "Cash", "Bank Transfer"])
            
            # M-PESA specific fields
            if payment_method == "M-PESA":
                phone_number = st.text_input("Phone Number", placeholder="254XXXXXXXXX")
                
            description = st.text_input("Payment Description")
            
            if st.form_submit_button("Process Payment"):
                try:
                    if payment_method == "M-PESA":
                        # Simulate M-PESA payment
                        st.info(f"Simulating M-PESA payment request to {phone_number}")
                        st.success("Payment request sent successfully!")
                        
                    # Record the payment in cashbook
                    data_manager.add_cashbook_entry(
                        description=description,
                        type_of_entry="Income",
                        amount=amount,
                        payment_method=payment_method
                    )
                    
                    # Generate receipt
                    st.write("---")
                    st.write("Receipt")
                    receipt_data = {
                        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "Amount": f"KES {amount:,.2f}",
                        "Payment Method": payment_method,
                        "Description": description,
                        "Status": "Completed"
                    }
                    
                    for key, value in receipt_data.items():
                        st.write(f"{key}: {value}")
                    
                except Exception as e:
                    st.error(f"Error processing payment: {str(e)}")
    
    with tab2:
        st.subheader("Payment History")
        
        # Get all payments from cashbook
        cashbook = data_manager.get_cashbook()
        if not cashbook.empty:
            # Filter only income entries
            payments = cashbook[cashbook['type'] == 'Income']
            
            # Date filter
            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("Start Date")
            with col2:
                end_date = st.date_input("End Date")
            
            # Apply date filter
            payments['date'] = pd.to_datetime(payments['date'])
            mask = (payments['date'].dt.date >= start_date) & (payments['date'].dt.date <= end_date)
            filtered_payments = payments.loc[mask]
            
            # Display payments
            if not filtered_payments.empty:
                st.dataframe(filtered_payments)
                
                # Payment summary
                st.subheader("Payment Summary")
                col1, col2 = st.columns(2)
                
                with col1:
                    total_amount = filtered_payments['amount'].sum()
                    st.metric("Total Payments", f"KES {total_amount:,.2f}")
                
                with col2:
                    payment_methods = filtered_payments['payment_method'].value_counts()
                    st.write("Payment Methods Breakdown:")
                    st.write(payment_methods)
            else:
                st.info("No payments found for the selected date range")
        else:
            st.info("No payment history available")
