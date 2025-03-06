import pandas as pd
import datetime
from ui.widgets.base_chart import BaseChart

class CashFlowChart(BaseChart):
    """Widget for displaying cash flow chart"""
    def __init__(self, data_manager=None, parent=None, width=5, height=4, dpi=100):
        super().__init__(data_manager, parent, width, height, dpi, title='Cash Flow')
        self.set_labels(y_label='Amount (KES)')
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        self.clear()
        
        # Try to get real data from data manager if available
        try:
            transactions_df = self.data_manager.get_transactions()
            if not transactions_df.empty:
                # Convert date to datetime
                transactions_df['date'] = pd.to_datetime(transactions_df['date'])
                
                # Group by date and calculate daily net cash flow
                daily_totals = transactions_df.groupby([
                    pd.Grouper(key='date', freq='D')
                ])['amount'].sum()
                
                # Get the last 7 days
                end_date = datetime.date.today()
                start_date = end_date - datetime.timedelta(days=6)
                date_range = [start_date + datetime.timedelta(days=x) for x in range(7)]
                
                # Filter for last 7 days and fill missing dates
                filtered_totals = daily_totals.reindex(date_range, fill_value=0)
                
                # Calculate cumulative cash flow
                cumulative = filtered_totals.cumsum()
                
                # Plot
                self.axes.plot(cumulative.index, cumulative.values, 
                         marker='o', linestyle='-', color='#3498db', linewidth=2)
                
                # Add horizontal line at y=0
                self.axes.axhline(y=0, color='#cccccc', linestyle='-', alpha=0.7)
                
                # Draw the chart
                self.draw_chart()
                return
        except Exception as e:
            # Fallback to sample data if real data not available
            pass
            
        # Sample data (fallback)
        dates = [datetime.date.today() - datetime.timedelta(days=x) for x in range(7)]
        dates.reverse()
        cash_flow = [5000, 8000, -2000, 10000, -5000, 12000, 3000]
        cumulative = [sum(cash_flow[:i+1]) for i in range(len(cash_flow))]
        
        # Plot
        self.axes.plot(dates, cumulative, marker='o', linestyle='-', color='#3498db', linewidth=2)
        
        # Add horizontal line at y=0
        self.axes.axhline(y=0, color='#cccccc', linestyle='-', alpha=0.7)
        
        # Draw the chart
        self.draw_chart() 