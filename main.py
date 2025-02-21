import streamlit as st
import pandas as pd
from datetime import datetime
from components import ledger, cashbook, inventory, payments

st.set_page_config(
    page_title="Cow Salt POS System",
    page_icon="🧂",
    layout="wide"
)

# Initialize session state
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'Home'

# Sidebar navigation
st.sidebar.title("Cow Salt POS")
page = st.sidebar.radio(
    "Navigate to",
    ["Home", "Stores Ledger", "Cash Book", "Inventory", "Payments"]
)

# Header
st.title("Cow Salt Production POS System")

# Page routing
if page == "Home":
    st.header("Welcome to Cow Salt POS System")
    
    # Dashboard metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(label="Today's Sales", value="KES 25,000")
    with col2:
        st.metric(label="Current Stock", value="500 KG")
    with col3:
        st.metric(label="Pending Orders", value="5")

elif page == "Stores Ledger":
    ledger.show_ledger()

elif page == "Cash Book":
    cashbook.show_cashbook()

elif page == "Inventory":
    inventory.show_inventory()

elif page == "Payments":
    payments.show_payments()

# Footer
st.markdown("---")
st.markdown("© 2024 Cow Salt POS System")
