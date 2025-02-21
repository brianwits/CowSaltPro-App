import streamlit as st
import pandas as pd
import plotly.express as px
from utils.data_manager import DataManager

def show_inventory():
    st.header("Inventory Management")
    
    data_manager = DataManager()
    
    # Tabs for different inventory functions
    tab1, tab2, tab3 = st.tabs(["Current Stock", "Product Management", "Stock Alerts"])
    
    with tab1:
        st.subheader("Current Stock Levels")
        inventory = data_manager.get_inventory()
        products = data_manager.get_products()
        
        if not inventory.empty and not products.empty:
            # Merge inventory with products to show product names
            full_inventory = pd.merge(inventory, products, on='product_id')
            st.dataframe(full_inventory)
            
            # Stock level visualization
            fig = px.bar(full_inventory, x='name', y='quantity',
                        title='Current Stock Levels by Product')
            st.plotly_chart(fig)
        else:
            st.info("No inventory data available")
    
    with tab2:
        st.subheader("Product Management")
        
        # Add new product
        with st.form("new_product"):
            st.write("Add New Product")
            product_id = st.text_input("Product ID")
            name = st.text_input("Product Name")
            price = st.number_input("Price", min_value=0.0)
            reorder_level = st.number_input("Reorder Level", min_value=0)
            
            if st.form_submit_button("Add Product"):
                products = data_manager.get_products()
                new_product = pd.DataFrame({
                    'product_id': [product_id],
                    'name': [name],
                    'price': [price],
                    'reorder_level': [reorder_level]
                })
                products = pd.concat([products, new_product], ignore_index=True)
                products.to_csv("data/products.csv", index=False)
                st.success("Product added successfully!")
        
        # Display existing products
        st.write("Existing Products")
        products = data_manager.get_products()
        if not products.empty:
            st.dataframe(products)
    
    with tab3:
        st.subheader("Stock Alerts")
        
        inventory = data_manager.get_inventory()
        products = data_manager.get_products()
        
        if not inventory.empty and not products.empty:
            # Merge inventory with products
            full_inventory = pd.merge(inventory, products, on='product_id')
            
            # Check for products below reorder level
            low_stock = full_inventory[full_inventory['quantity'] <= full_inventory['reorder_level']]
            
            if not low_stock.empty:
                st.warning("The following products need to be reordered:")
                for _, row in low_stock.iterrows():
                    st.write(f"- {row['name']}: Current stock {row['quantity']}, Reorder level {row['reorder_level']}")
            else:
                st.success("All products are above reorder levels")
