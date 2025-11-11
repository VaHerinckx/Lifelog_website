import React, { useState } from 'react';
import { DollarSign, Calendar, Building, Tag, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import './TransactionList.css';

const TransactionList = ({ transactions, onTransactionClick }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (sortField === 'date') {
      try {
        const cleanA = String(aValue).trim();
        const cleanB = String(bValue).trim();
        
        aValue = new Date(cleanA);
        bValue = new Date(cleanB);
        
        // If invalid, try parsing just the date part
        if (isNaN(aValue.getTime())) {
          const datePart = cleanA.split(' ')[0];
          aValue = new Date(datePart);
        }
        if (isNaN(bValue.getTime())) {
          const datePart = cleanB.split(' ')[0];
          bValue = new Date(datePart);
        }
      } catch (e) {
        aValue = new Date(0);
        bValue = new Date(0);
      }
    } else if (sortField === 'Amount' || sortField === 'amount_eur' || sortField === 'movement') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `€${numAmount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return 'No Date';
      }
      
      // Clean the date string and parse it
      const cleanDateString = dateString.toString().trim();
      let date = new Date(cleanDateString);
      
      // If invalid, try parsing just the date part
      if (isNaN(date.getTime())) {
        const datePart = cleanDateString.split(' ')[0]; // Get just "YYYY-MM-DD"
        date = new Date(datePart);
      }
      
      // If still invalid, return the original string
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get transaction type icon and color
  const getTransactionTypeDisplay = (type) => {
    let color, Icon, text;

    if (type === 'income') {
      color = 'var(--color-success)';
      Icon = ArrowUp;
      text = 'Income';
    } else if (type === 'expense') {
      color = 'var(--color-accent)';
      Icon = ArrowDown;
      text = 'Expense';
    } else if (type === 'incoming_transfer') {
      color = 'var(--color-success)';
      Icon = ArrowUp;
      text = 'Transfer In';
    } else if (type === 'outgoing_transfer') {
      color = 'var(--color-accent)';
      Icon = ArrowDown;
      text = 'Transfer Out';
    } else {
      color = 'var(--color-text-secondary)';
      Icon = ArrowDown;
      text = type || 'Unknown';
    }

    return {
      icon: <Icon size={16} style={{ color }} />,
      color,
      text
    };
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Debug transaction data - show available columns
  const debugColumns = transactions && transactions.length > 0 ? Object.keys(transactions[0]) : [];
  const periodColumn = debugColumns.find(col => col.toLowerCase().includes('period') || col.toLowerCase().includes('date'));

  if (!transactions || transactions.length === 0) {
    return (
      <div className="transaction-list-container">
        <div className="empty-state">
          <DollarSign size={48} className="empty-state-icon" />
          <p className="empty-state-message">
            No transactions found with current filters. Try adjusting your filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list-container">
      <div className="transaction-list-header">
        <h2>Transactions</h2>
        <p className="transaction-list-description">
          All your financial movements in one place
        </p>
      </div>

      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th
                className="sortable"
                onClick={() => handleSort('date')}
              >
                <div className="th-content">
                  <Calendar size={16} />
                  Date {renderSortIndicator('date')}
                </div>
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('Description')}
              >
                <div className="th-content">
                  <FileText size={16} />
                  Description {renderSortIndicator('Description')}
                </div>
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('Category')}
              >
                <div className="th-content">
                  <Tag size={16} />
                  Category {renderSortIndicator('Category')}
                </div>
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('Accounts')}
              >
                <div className="th-content">
                  <Building size={16} />
                  Account {renderSortIndicator('Accounts')}
                </div>
              </th>
              <th>Type</th>
              <th
                className="sortable amount-column"
                onClick={() => handleSort('movement')}
              >
                <div className="th-content">
                  <DollarSign size={16} />
                  Amount (EUR) {renderSortIndicator('movement')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, index) => {
              const typeDisplay = getTransactionTypeDisplay(transaction.transaction_type);
              
              return (
                <tr 
                  key={index} 
                  className="transaction-row"
                  onClick={() => onTransactionClick && onTransactionClick(transaction)}
                >
                  <td className="date-cell">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="description-cell">
                    <div className="description-content">
                      <span className="main-description">
                        {transaction.Description || 'No description'}
                      </span>
                      {transaction.Note && (
                        <span className="note-text">
                          {transaction.Note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="category-cell">
                    <div className="category-content">
                      <span className="main-category">{transaction.Category}</span>
                      {transaction.Subcategory && transaction.Subcategory !== transaction.Category && (
                        <span className="subcategory">{transaction.Subcategory}</span>
                      )}
                    </div>
                  </td>
                  <td className="account-cell">
                    {transaction.Accounts}
                  </td>
                  <td className="type-cell">
                    <div className="type-content">
                      {typeDisplay.icon}
                      <span style={{ color: typeDisplay.color }}>
                        {typeDisplay.text}
                      </span>
                    </div>
                  </td>
                  <td className="amount-cell">
                    <span
                      className="amount-value"
                      style={{ color: typeDisplay.color }}
                    >
                      {formatCurrency(transaction.movement)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;