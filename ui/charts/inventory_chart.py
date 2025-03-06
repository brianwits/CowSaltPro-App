import pandas as pd
from ui.widgets.base_chart import BaseChart

class InventoryChart(BaseChart):
    """Widget for displaying inventory levels chart"""
    def __init__(self, data_manager=None, parent=None, width=5, height=4, dpi=100):
        super().__init__(data_manager, parent, width, height, dpi, title='Current Inventory Levels')
        self.set_labels(y_label='Quantity (KG)')
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        self.clear()
        
        # Try to get real data from data manager if available
        try:
            inventory_df = self.data_manager.get_inventory()
            products_df = self.data_manager.get_products()
            
            if not inventory_df.empty and not products_df.empty:
                # Merge to get product names
                merged_df = pd.merge(inventory_df, products_df, on='product_id')
                
                if not merged_df.empty:
                    # Plot bars
                    bars = self.axes.bar(merged_df['name'], merged_df['quantity'], color='#2ecc71')
                    
                    # Set y-axis limit
                    max_quantity = merged_df['quantity'].max()
                    self.axes.set_ylim(0, max_quantity * 1.2)
                    
                    # Add values on top of bars
                    for bar in bars:
                        height = bar.get_height()
                        self.axes.annotate(f'{height}',
                                  xy=(bar.get_x() + bar.get_width() / 2, height),
                                  xytext=(0, 3),  # 3 points vertical offset
                                  textcoords="offset points",
                                  ha='center', va='bottom')
                    
                    # Draw the chart
                    self.draw_chart()
                    return
        except Exception as e:
            # Fallback to sample data if real data not available
            pass
            
        # Sample data (fallback)
        products = ['Salt A', 'Salt B', 'Salt C', 'Salt D', 'Salt E']
        quantities = [500, 350, 200, 450, 300]
        
        # Plot
        bars = self.axes.bar(products, quantities, color='#2ecc71')
        
        # Set y-axis limit
        self.axes.set_ylim(0, max(quantities) * 1.2)
        
        # Add values on top of bars
        for bar in bars:
            height = bar.get_height()
            self.axes.annotate(f'{height}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3),  # 3 points vertical offset
                       textcoords="offset points",
                       ha='center', va='bottom')
                       
        # Draw the chart
        self.draw_chart() 