import React, { useMemo } from 'react';
import _ from 'lodash';
import './FinanceAnalysisTab.css';

// Import existing chart components
import TimeSeriesBarChart from '../../../components/charts/TimeSeriesBarChart';
import TopChart from '../../../components/charts/TopChart';
import TreemapGenre from '../../../components/charts/TreemapGenre';

const FinanceAnalysisTab = ({ data }) => {
  // Process data for monthly spending trends
  const monthlySpendingData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by month and calculate totals
    const groupedByMonth = _.groupBy(data, (item) => {
      try {
        const cleanPeriod = item.Period.toString().trim();
        let date = new Date(cleanPeriod);
        
        // If invalid, try parsing just the date part
        if (isNaN(date.getTime())) {
          const datePart = cleanPeriod.split(' ')[0];
          date = new Date(datePart);
        }
        
        if (isNaN(date.getTime())) {
          return 'invalid';
        }
        
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return 'invalid';
      }
    });

    return Object.entries(groupedByMonth)
      .filter(([month]) => month !== 'invalid') // Filter out invalid dates
      .map(([month, transactions]) => {
        let income = 0;
        let expenses = 0;

        transactions.forEach(transaction => {
          const amount = Math.abs(parseFloat(transaction.Amount) || 0);
          if (transaction['Income/Expense'] === 'Income') {
            income += amount;
          } else if (transaction['Income/Expense'] === 'Expense') {
            expenses += amount;
          }
        });

        return {
          date: new Date(month + '-01'),
          income,
          expenses,
          net: income - expenses,
          month: month
        };
      })
      .sort((a, b) => a.date - b.date)
      .slice(-12); // Last 12 months
  }, [data]);

  // Process data for expense by category
  const expenseByCategoryData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const expensesByCategory = {};
    
    data.forEach(transaction => {
      if (transaction['Income/Expense'] === 'Expense') {
        const category = transaction.Category || 'Other';
        const amount = Math.abs(parseFloat(transaction.Amount) || 0);
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
      }
    });

    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        name: category,
        value: Math.round(amount * 100) / 100 // Round to 2 decimals
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 categories
  }, [data]);

  // Process data for income by category
  const incomeByCategoryData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const incomeByCategory = {};
    
    data.forEach(transaction => {
      if (transaction['Income/Expense'] === 'Income') {
        const category = transaction.Category || 'Other';
        const amount = Math.abs(parseFloat(transaction.Amount) || 0);
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
      }
    });

    return Object.entries(incomeByCategory)
      .map(([category, amount]) => ({
        name: category,
        value: Math.round(amount * 100) / 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 income categories
  }, [data]);

  // Process data for account distribution
  const accountDistributionData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const transactionsByAccount = {};
    
    data.forEach(transaction => {
      const account = transaction.Accounts || 'Unknown';
      const amount = Math.abs(parseFloat(transaction.Amount) || 0);
      if (!transactionsByAccount[account]) {
        transactionsByAccount[account] = { total: 0, count: 0 };
      }
      transactionsByAccount[account].total += amount;
      transactionsByAccount[account].count += 1;
    });

    return Object.entries(transactionsByAccount)
      .map(([account, data]) => ({
        name: account,
        value: Math.round(data.total * 100) / 100,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Process data for weekly spending pattern
  const weeklyPatternData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const expensesByWeek = _.groupBy(
      data.filter(t => t['Income/Expense'] === 'Expense'),
      (item) => {
        try {
          const cleanPeriod = item.Period.toString().trim();
          let date = new Date(cleanPeriod);
          
          // If invalid, try parsing just the date part
          if (isNaN(date.getTime())) {
            const datePart = cleanPeriod.split(' ')[0];
            date = new Date(datePart);
          }
          
          if (isNaN(date.getTime())) {
            return 'invalid';
          }
          
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          return startOfWeek.toISOString().split('T')[0];
        } catch (e) {
          return 'invalid';
        }
      }
    );

    return Object.entries(expensesByWeek)
      .filter(([weekStart]) => weekStart !== 'invalid') // Filter out invalid dates
      .map(([weekStart, transactions]) => {
        const total = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.Amount) || 0), 0);
        return {
          date: new Date(weekStart),
          value: Math.round(total * 100) / 100,
          count: transactions.length
        };
      })
      .sort((a, b) => a.date - b.date)
      .slice(-16); // Last 16 weeks
  }, [data]);

  // Process data for subcategory spending
  const subcategorySpendingData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const expensesBySubcategory = {};
    
    data.forEach(transaction => {
      if (transaction['Income/Expense'] === 'Expense' && transaction.Subcategory) {
        const subcategory = transaction.Subcategory;
        const amount = Math.abs(parseFloat(transaction.Amount) || 0);
        expensesBySubcategory[subcategory] = (expensesBySubcategory[subcategory] || 0) + amount;
      }
    });

    return Object.entries(expensesBySubcategory)
      .map(([subcategory, amount]) => ({
        name: subcategory,
        value: Math.round(amount * 100) / 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 subcategories
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="analysis-tab-container">
        <div className="analysis-empty-state">
          <p>No data available with current filters. Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-tab-container">
      <div className="analysis-charts-grid">
        {/* Monthly Income vs Expenses */}
        <div className="analysis-chart-section">
          <div className="chart-container-base">
            <h3 className="chart-title">Monthly Income vs Expenses</h3>
            <div className="chart-placeholder">
              <p>Dual-axis chart showing monthly income and expense trends</p>
              <p>{monthlySpendingData.length} months of data</p>
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        <div className="analysis-chart-section">
          <TopChart
            data={expenseByCategoryData}
            title="Top Expense Categories"
            color="#FB4B4E"
            valueFormatter={(value) => `€${value.toLocaleString()}`}
          />
        </div>

        {/* Expense Category Distribution (Treemap) */}
        <div className="analysis-chart-section">
          <TreemapGenre
            data={expenseByCategoryData}
            title="Expense Category Distribution"
          />
        </div>

        {/* Weekly Spending Pattern */}
        <div className="analysis-chart-section">
          <TimeSeriesBarChart
            data={weeklyPatternData}
            title="Weekly Spending Pattern"
            xAxisDataKey="date"
            yAxisDataKey="value"
            color="#3423A6"
            valueFormatter={(value) => `€${value}`}
          />
        </div>

        {/* Income Categories */}
        <div className="analysis-chart-section">
          <TopChart
            data={incomeByCategoryData}
            title="Income Sources"
            color="#22c55e"
            layout="horizontal"
            valueFormatter={(value) => `€${value.toLocaleString()}`}
          />
        </div>

        {/* Account Distribution */}
        <div className="analysis-chart-section">
          <TopChart
            data={accountDistributionData}
            title="Activity by Account"
            color="#8b5cf6"
            layout="horizontal"
            valueFormatter={(value) => `€${value.toLocaleString()}`}
          />
        </div>

        {/* Subcategory Spending */}
        <div className="analysis-chart-section">
          <TopChart
            data={subcategorySpendingData}
            title="Top Spending Subcategories"
            color="#f59e0b"
            valueFormatter={(value) => `€${value.toLocaleString()}`}
          />
        </div>

        {/* Monthly Net Balance */}
        <div className="analysis-chart-section">
          <div className="chart-container-base">
            <h3 className="chart-title">Monthly Net Balance</h3>
            <div className="chart-placeholder">
              <p>Monthly net balance (Income - Expenses) over time</p>
              <p>Average: €{monthlySpendingData.length > 0 
                ? Math.round(monthlySpendingData.reduce((sum, m) => sum + m.net, 0) / monthlySpendingData.length)
                : 0}/month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalysisTab;