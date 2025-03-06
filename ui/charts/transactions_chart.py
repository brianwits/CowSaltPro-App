import pandas as pd
from ui.widgets.base_chart import BaseChart

class TransactionsChart(BaseChart):
    """Widget for displaying transactions chart"""
    def __init__(self, data_manager=None, parent=None, width=5, height=4, dpi=100):
        super().__init__(data_manager, parent, width, height, dpi, title='Daily Transactions')
        self.set_labels(y_label='Amount (KES)')
        self.update_chart()
        
    def update_chart(self):
        """Update chart with current data"""
        self.clear()
        
        # Get transactions data
        transactions_df = self.data_manager.get_transactions()
        
        if not transactions_df.empty:
            # Convert date to datetime
            transactions_df['date'] = pd.to_datetime(transactions_df['date'])
            
            # Group by date and transaction type
            daily_totals = transactions_df.groupby([
                pd.Grouper(key='date', freq='D'), 
                'transaction_type'
            ])['amount'].sum().unstack().fillna(0)
            
            # Plot
            if 'Income' in daily_totals.columns:
                self.axes.bar(daily_totals.index, daily_totals['Income'], 
                        color='green', label='Income')
            if 'Expense' in daily_totals.columns:
                self.axes.bar(daily_totals.index, -daily_totals['Expense'], 
                        color='red', label='Expense')
                
            self.axes.legend()
                
        # Draw the chart
        self.draw_chart() 