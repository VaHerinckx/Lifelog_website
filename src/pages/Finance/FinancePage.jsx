import { useState, useEffect, useMemo } from 'react';
import { DollarSign, List, Grid, Calendar, Tag, Building, TrendingUp, FileText, ShoppingBag } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageTitle } from '../../hooks/usePageTitle';

// Import components
import TransactionDetails from './components/TransactionDetails';
import TransactionCard from './components/TransactionCard';

// Import standardized UI components
import {
  FilteringPanel,
  Filter,
  PageWrapper,
  PageHeader,
  TabNavigation,
  ContentTab,
  AnalysisTab,
  KPICardsPanel,
  ContentCardsGroup
} from '../../components/ui';
import KpiCard from '../../components/charts/KpiCard';

// Import chart components for analysis tab
import TimeSeriesBarChart from '../../components/charts/TimeSeriesBarChart';
import IntensityHeatmap from '../../components/charts/IntensityHeatmap';
import TopChart from '../../components/charts/TopChart';

// Import utilities
import { sortByDateSafely } from '../../utils/sortingUtils';

const FinancePage = () => {
  usePageTitle('Finance');
  const { data, loading, error, fetchData } = useData();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [viewMode, setViewMode] = useState('grid');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('content');

  // Fetch finance data when component mounts
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData('finance');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process finance data when it's loaded
  useEffect(() => {
    if (data?.finance) {
      // Convert date strings to Date objects for JavaScript date operations
      const processedTransactions = data.finance.map(transaction => ({
        ...transaction,
        date: transaction.date ? new Date(transaction.date) : null
      }));

      // Sort by most recent first
      const sortedTransactions = sortByDateSafely(processedTransactions, 'date');

      setTransactions(sortedTransactions);
      setFilteredTransactions(sortedTransactions);
      // Reset content ready state when new data arrives
      }
  }, [data?.finance]);

  // Apply filters when FilteringPanel filters change
  // FilteringPanel now returns pre-filtered data per source!
  const handleFiltersChange = (filteredDataSources) => {
    // Re-sort filtered data (most recent first)
    const sortedTransactions = sortByDateSafely(filteredDataSources.finance || [], 'date');

    setFilteredTransactions(sortedTransactions);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseDetails = () => {
    setSelectedTransaction(null);
  };

  // Helper function to sort accounts with [OLD] at the bottom
  const sortAccountOptions = (accounts) => {
    return accounts.sort((a, b) => {
      const aIsOld = a.startsWith('[OLD]');
      const bIsOld = b.startsWith('[OLD]');

      if (aIsOld && !bIsOld) return 1;
      if (!aIsOld && bIsOld) return -1;
      return a.localeCompare(b);
    });
  };

  // Memoize data object to prevent FilteringPanel re-renders
  const filterPanelData = useMemo(() => ({
    finance: transactions
  }), [transactions]);

  // Get unique accounts and sort them
  const accountOptions = useMemo(() => {
    if (!transactions.length) return [];
    // Try both capitalized (Accounts) and lowercase (accounts) for compatibility
    const uniqueAccounts = [...new Set(transactions.map(t => t.Accounts || t.accounts).filter(Boolean))];
    return sortAccountOptions(uniqueAccounts);
  }, [transactions]);

  return (
    <PageWrapper
      error={error?.finance}
      errorTitle="Finance Tracker"
    >
      {/* Page Header */}
      <PageHeader
        title="Finance Tracker"
        description="Track your income, expenses, and financial patterns over time"
      />

        {!loading?.finance && (
          <>
            {/* FilteringPanel with Filter children */}
            <FilteringPanel
              data={filterPanelData}
              onFiltersChange={handleFiltersChange}
            >
              <Filter
                type="daterange"
                label="Transaction Date"
                field="date"
                icon={<Calendar />}
                dataSources={['finance']}
              />

              <Filter
                type="hierarchical"
                selectionMode="multi"
                label="Category & Subcategory"
                field="category"
                childField="subcategory"
                icon={<Tag />}
                placeholder="Select categories and subcategories"
                dataSources={['finance']}
              />
              <Filter
                type="multiselect"
                label="Counterparty"
                field="note"
                icon={<TrendingUp />}
                placeholder="Select counterparty"
                dataSources={['finance']}
              />
              <Filter
                type="multiselect"
                label="Accounts"
                field="accounts"
                icon={<Building />}
                placeholder="Select accounts"
                dataSources={['finance']}
                options={accountOptions}
              />
              <Filter
                type="multiselect"
                label="Transaction Type"
                field="transaction_type"
                icon={<TrendingUp />}
                placeholder="Select transaction types"
                dataSources={['finance']}
              />
            </FilteringPanel>

            {/* Statistics Cards with KpiCard children */}
            <KPICardsPanel
              dataSources={{
                finance: filteredTransactions
              }}
              loading={loading?.finance}
            >
              <KpiCard
                dataSource="finance"
                computation="count"
                label="Total Transactions"
                icon={<FileText />}
              />
              <KpiCard
                dataSource="finance"
                field="movement"
                computation="sum"
                filterCondition={(item) => item.transaction_type === 'income'}
                computationOptions={{
                  decimals: 2
                }}
                formatOptions={{
                  type: 'number',
                  decimals: 2,
                  prefix: '€',
                  locale: 'en-US'
                }}
                label="Total Income"
                icon={<TrendingUp />}
              />
              <KpiCard
                dataSource="finance"
                field="movement"
                computation="sum"
                filterCondition={(item) => item.transaction_type === 'expense'}
                computationOptions={{
                  decimals: 2
                }}
                formatOptions={{
                  type: 'number',
                  decimals: 2,
                  prefix: '€',
                  locale: 'en-US'
                }}
                label="Total Expenses"
                icon={<DollarSign />}
              />
              <KpiCard
                dataSource="finance"
                field="movement"
                computation="sum"
                computationOptions={{
                  decimals: 2
                }}
                formatOptions={{
                  type: 'number',
                  decimals: 2,
                  prefix: '€',
                  locale: 'en-US'
                }}
                label="Net Balance"
                icon={<TrendingUp />}
              />
              <KpiCard
                dataSource="finance"
                field="corrected_eur"
                computation="average"
                filterCondition={(item) => item.transaction_type === 'expense'}
                computationOptions={{
                  decimals: 2
                }}
                formatOptions={{
                  type: 'number',
                  decimals: 2,
                  prefix: '€',
                  locale: 'en-US'
                }}
                label="Average Transaction"
                icon={<DollarSign />}
              />
              <KpiCard
                dataSource="finance"
                field="category"
                computation="mode"
                label="Most Frequent Category"
                icon={<Tag />}
              />
              <KpiCard
                dataSource="finance"
                field="note"
                computation="mode"
                label="Most Frequent Counterparty"
                icon={<ShoppingBag />}
              />
            </KPICardsPanel>

            {/* Tab Navigation */}
            <TabNavigation
              contentLabel="Transactions"
              contentIcon={DollarSign}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {/* Transactions Tab Content */}
        {activeTab === 'content' && (
          <ContentTab
            loading={loading?.finance}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModes={[
              { mode: 'grid', icon: Grid },
              { mode: 'list', icon: List }
            ]}
            items={filteredTransactions}
            loadingIcon={DollarSign}
            emptyState={{
              icon: DollarSign,
              title: "No transactions found",
              message: "No transactions match your current filters. Try adjusting your criteria."
            }}
            renderGrid={(transactionsData) => (
              <ContentCardsGroup
                items={transactionsData}
                viewMode="grid"
                renderItem={(transaction) => (
                  <TransactionCard
                    key={`${transaction.date}-${transaction.accounts}-${transaction.corrected_eur}-${transaction.category}`}
                    transaction={transaction}
                    viewMode="grid"
                    onClick={handleTransactionClick}
                  />
                )}
              />
            )}
            renderList={(transactionsData) => (
              <ContentCardsGroup
                items={transactionsData}
                viewMode="list"
                renderItem={(transaction) => (
                  <TransactionCard
                    key={`list-${transaction.date}-${transaction.accounts}-${transaction.corrected_eur}-${transaction.category}`}
                    transaction={transaction}
                    viewMode="list"
                    onClick={handleTransactionClick}
                  />
                )}
              />
            )}
          />
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            data={filteredTransactions}
            emptyState={{
              message: "No transaction data available with current filters. Try adjusting your criteria."
            }}
            renderCharts={(transactionsData) => (
              <>
              <TimeSeriesBarChart
                data={transactionsData}
                dateColumnName="date"
                metricOptions={[
                  { value: 'total_amount', label: 'Total Amount', aggregation: 'sum', field: 'corrected_eur', decimals: 0, suffix: '€'},
                  { value: 'average_amount', label: 'Average Amount', aggregation: 'average', field: 'corrected_eur', decimals: 0, suffix: '€'},
                  { value: 'balance', label: 'Balance', aggregation: 'sum', field: 'movement', decimals: 0, suffix: '€'},
                  { value: 'cumulative_balance', label: 'Cumulative Balance', aggregation: 'cumsum', field: 'movement', decimals: 0, suffix: '€'},
                  { value: 'transactions', label: 'Total Transactions', field: 'transaction_id', aggregation: 'count_distinct', unit: 'transactions', decimals: 0},
                ]}
                defaultMetric="total_amount"
                title="Finances Over Time"
              />
              <IntensityHeatmap
                data={transactionsData}
                dateColumnName="date"
                metricOptions={[
                  { value: 'total_amount', label: 'Total Amount', column: 'corrected_eur', aggregation: 'sum', unit: 'eur', suffix: ' €' },
                  { value: 'avg_amount', label: 'Average Amount', column: 'corrected_eur', aggregation: 'average', unit: 'eur', decimals: 1, suffix: ' €' },
                  { value: 'transactions', label: 'Total Transactions', column: 'transaction_id', aggregation: 'count_distinct', unit: 'transactions', decimals: 0},
                ]}
                rowAxis="time_period"    // Time periods as rows
                columnAxis="weekday"     // Days as columns
                defaultMetric="total_amount"
                showAxisSwap={true}  // Hide the swap button
                title="Transactions Activity"
              />
              <TopChart
                data={transactionsData}
                dimensionOptions={[
                  { value: 'category', label: 'Category', field: 'category', labelFields: ['category'] },
                  { value: 'subcategory', label: 'Subcategory', field: 'subcategory', labelFields: ['subcategory'] },
                  { value: 'counterparty', label: 'Counterparty', field: 'note', labelFields: ['counterparty'] },
                  { value: 'accounts', label: 'Accounts', field: 'accounts', labelFields: ['accounts'] },
                ]}
                metricOptions={[
                  { value: 'total_amount', label: 'Total Amount', aggregation: 'sum', field: 'corrected_eur', decimals: 0, suffix: '€'},
                  { value: 'average_amount', label: 'Average Amount', aggregation: 'average', field: 'corrected_eur', decimals: 0, suffix: '€'},
                  { value: 'transactions', label: 'Total Transactions', field: 'transaction_id', aggregation: 'count_distinct', unit: 'transactions', decimals: 0},
                ]}
                defaultDimension="category"
                defaultMetric="total_amount"
                title="Top Finance Analysis"
                topN={10}
                enableTopNControl={true}
                topNOptions={[5, 10, 15, 20, 25, 30]}
                enableSortToggle={true}
                scrollable={true}
                barHeight={50}
              />
              </>
            )}
          />
        )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetails transaction={selectedTransaction} onClose={handleCloseDetails} />
      )}
    </PageWrapper>
  );
};

export default FinancePage;
