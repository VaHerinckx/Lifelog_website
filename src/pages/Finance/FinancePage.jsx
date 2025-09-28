import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart, Calendar, Tag, Building, FileText, TrendingUp } from 'lucide-react';
import _ from 'lodash';
import './FinancePage.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import components
import FinanceAnalysisTab from './components/FinanceAnalysisTab';
import TransactionList from './components/TransactionList';
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const FinancePage = () => {
  const { data, loading, error, fetchData } = useData();
  
  // State for filters
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // State for tab management
  const [activeTab, setActiveTab] = useState('transactions');
  
  // State for finance stats
  const [financeStats, setFinanceStats] = useState({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0
  });

  // Define filter configurations for FilteringPanel
  const filterConfigs = [
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Date Range',
      dataField: 'èèPeriod',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    },
    {
      key: 'categories',
      type: 'multiselect',
      label: 'Categories',
      optionsSource: 'Category',
      dataField: 'Category',
      icon: <Tag size={16} />,
      placeholder: 'Select categories',
      searchPlaceholder: 'Search categories...'
    },
    {
      key: 'subcategories',
      type: 'multiselect',
      label: 'Subcategories',
      optionsSource: 'Subcategory',
      dataField: 'Subcategory',
      icon: <Tag size={16} />,
      placeholder: 'Select subcategories',
      searchPlaceholder: 'Search subcategories...'
    },
    {
      key: 'accounts',
      type: 'multiselect',
      label: 'Accounts',
      optionsSource: 'Accounts',
      dataField: 'Accounts',
      icon: <Building size={16} />,
      placeholder: 'Select accounts',
      searchPlaceholder: 'Search accounts...'
    },
    {
      key: 'incomeExpense',
      type: 'multiselect',
      label: 'Type',
      optionsSource: 'Income/Expense',
      dataField: 'Income/Expense',
      icon: <TrendingUp size={16} />,
      placeholder: 'Select type',
      searchPlaceholder: 'Income or Expense...'
    },
    {
      key: 'notes',
      type: 'multiselect',
      label: 'Notes',
      optionsSource: 'Note',
      dataField: 'Note',
      icon: <FileText size={16} />,
      placeholder: 'Select notes',
      searchPlaceholder: 'Search notes...'
    }
  ];

  // Fetch finance data when component mounts
  useEffect(() => {
    fetchData('finances');
  }, [fetchData]);

  // Apply filters whenever filters or data change
  useEffect(() => {
    if (!data.finances || data.finances.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data.finances];

    // Apply date range filter
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      filtered = filtered.filter(item => {
        if (!item.èèPeriod) return false;
        
        // Parse the date properly - format is "YYYY-MM-DD HH:MM:SS"
        let itemDate;
        try {
          // Clean the period string and parse it
          const cleanPeriod = item.èèPeriod.toString().trim();
          itemDate = new Date(cleanPeriod);
          
          // If invalid, try parsing just the date part
          if (isNaN(itemDate.getTime())) {
            const datePart = cleanPeriod.split(' ')[0]; // Get just "YYYY-MM-DD"
            itemDate = new Date(datePart);
          }
          
          // If still invalid, skip this item
          if (isNaN(itemDate.getTime())) {
            return false;
          }
        } catch (e) {
          return false;
        }
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        
        return true;
      });
    }

    // Apply category filter
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      filtered = filtered.filter(item => filters.categories.includes(item.Category));
    }

    // Apply subcategory filter
    if (filters.subcategories && Array.isArray(filters.subcategories) && filters.subcategories.length > 0) {
      filtered = filtered.filter(item => filters.subcategories.includes(item.Subcategory));
    }

    // Apply accounts filter
    if (filters.accounts && Array.isArray(filters.accounts) && filters.accounts.length > 0) {
      filtered = filtered.filter(item => filters.accounts.includes(item.Accounts));
    }

    // Apply income/expense filter
    if (filters.incomeExpense && Array.isArray(filters.incomeExpense) && filters.incomeExpense.length > 0) {
      filtered = filtered.filter(item => filters.incomeExpense.includes(item['Income/Expense']));
    }

    // Apply notes filter
    if (filters.notes && Array.isArray(filters.notes) && filters.notes.length > 0) {
      filtered = filtered.filter(item => filters.notes.includes(item.Note));
    }

    // Sort by date in descending order (newest first)
    filtered.sort((a, b) => {
      try {
        const cleanPeriodA = a.èèPeriod.toString().trim();
        const cleanPeriodB = b.èèPeriod.toString().trim();
        
        let dateA = new Date(cleanPeriodA);
        let dateB = new Date(cleanPeriodB);
        
        // If invalid, try parsing just the date part
        if (isNaN(dateA.getTime())) {
          const datePart = cleanPeriodA.split(' ')[0];
          dateA = new Date(datePart);
        }
        if (isNaN(dateB.getTime())) {
          const datePart = cleanPeriodB.split(' ')[0];
          dateB = new Date(datePart);
        }
        
        return dateB - dateA; // Descending order
      } catch (e) {
        return 0;
      }
    });

    setFilteredData(filtered);
  }, [data.finances, filters]);

  // Calculate finance stats whenever filtered data changes
  useEffect(() => {
    if (!filteredData.length) {
      setFinanceStats({
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0
      });
      return;
    }

    const totalTransactions = filteredData.length;
    
    // Calculate total income and expenses
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredData.forEach(item => {
      const amount = parseFloat(item.Amount) || 0;
      const type = item['Income/Expense'];
      
      if (type === 'Income') {
        totalIncome += Math.abs(amount);
      } else if (type === 'Expense') {
        totalExpenses += Math.abs(amount);
      }
    });

    const netBalance = totalIncome - totalExpenses;

    setFinanceStats({
      totalTransactions,
      totalIncome,
      totalExpenses,
      netBalance
    });
  }, [filteredData]);

  // Handle filter changes from FilteringPanel
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Generate summary cards data
  const generateCardsData = () => {
    return [
      {
        value: financeStats.totalTransactions.toLocaleString(),
        label: "Total Transactions",
        icon: <FileText size={24} />
      },
      {
        value: `€${financeStats.totalIncome.toLocaleString()}`,
        label: "Total Income",
        icon: <TrendingUp size={24} />
      },
      {
        value: `€${financeStats.totalExpenses.toLocaleString()}`,
        label: "Total Expenses",
        icon: <DollarSign size={24} />
      },
      {
        value: `€${financeStats.netBalance.toLocaleString()}`,
        label: "Net Balance",
        icon: <BarChart size={24} />
      }
    ];
  };

  const cardsData = generateCardsData();

  // Loading state
  if (loading.finances) {
    return <LoadingSpinner centerIcon={DollarSign} />;
  }

  // Error state
  if (error.finances) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Finance Dashboard</h1>
          <div className="error">
            Error loading finance data: {error.finances}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data.finances || data.finances.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Finance Dashboard</h1>
          <div className="empty-state">
            <DollarSign size={48} className="empty-state-icon" />
            <p className="empty-state-message">
              No finance data available. Finance data will appear here once it's processed and uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Finance Dashboard</h1>
        <p className="page-description">Track your income, expenses, and financial patterns over time</p>

        {/* Tab Navigation */}
        <div className="page-tabs">
          <button
            className={`page-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <FileText size={18} style={{ marginRight: '8px' }} />
            Transactions
          </button>
          <button
            className={`page-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <BarChart size={18} style={{ marginRight: '8px' }} />
            Analysis
          </button>
        </div>

        {/* Filters */}
        <FilteringPanel
          data={data.finances}
          filterConfigs={filterConfigs}
          onFiltersChange={handleFiltersChange}
          title="Finance Filters"
          description="Filter your financial data by date, category, account, and transaction type"
        />

        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && (
          <>
            <div className="transaction-count">
              {filteredData.length} {filteredData.length === 1 ? 'transaction' : 'transactions'} found
            </div>

            <CardsPanel
              title="Financial Statistics"
              description="Your financial metrics at a glance"
              cards={cardsData}
              loading={loading.finances}
            />

            <TransactionList
              transactions={filteredData}
              onTransactionClick={setSelectedTransaction}
            />
          </>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <FinanceAnalysisTab data={filteredData} />
        )}
      </div>
    </div>
  );
};

export default FinancePage;