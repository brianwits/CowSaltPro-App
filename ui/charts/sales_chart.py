import datetime
from ui.widgets.base_chart import BaseChart
import pandas as pd

class SalesChart(BaseChart):
    """Widget for displaying sales chart"""
    def __init__(self, data_manager=None, parent=None, width=5, height=4, dpi=100):
        super().__init__(data_manager, parent, width, height, dpi, title='Weekly Sales')
        self.set_labels(y_label='Sales (KES)')
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        self.clear()
        
        # Try to get real data from data manager if available
        try:
            transactions_df = self.data_manager.get_transactions()
            if not transactions_df.empty and 'Income' in transactions_df['transaction_type'].values:
                # Filter for income/sales transactions
                sales_df = transactions_df[transactions_df['transaction_type'] == 'Income']
                
                # Convert date column to datetime
                sales_df['date'] = pd.to_datetime(sales_df['date'])
                
                # Group by date
                daily_sales = sales_df.groupby(sales_df['date'].dt.date)['amount'].sum()
                
                # Get the last 7 days
                end_date = datetime.date.today()
                start_date = end_date - datetime.timedelta(days=6)
                date_range = [start_date + datetime.timedelta(days=x) for x in range(7)]
                
                # Filter for last 7 days and fill missing dates
                filtered_sales = daily_sales.reindex(date_range, fill_value=0)
                
                # Plot
                self.axes.plot(filtered_sales.index, filtered_sales.values, 
                               marker='o', linestyle='-', color='#3498db', linewidth=2)
                
                return
        except Exception as e:
            # Fallback to sample data if real data not available
            pass
            
        # Sample data (fallback)
        dates = [datetime.date.today() - datetime.timedelta(days=x) for x in range(7)]
        dates.reverse()
        sales = [15000, 22000, 18000, 25000, 30000, 28000, 25000]
        
        # Plot
        self.axes.plot(dates, sales, marker='o', linestyle='-', color='#3498db', linewidth=2)
        
        # Draw the chart
        self.draw_chart() 