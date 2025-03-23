import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import './ReadingPaceChart.css';

const ReadingPaceChart = ({ data, dateRange, selectedPeriod, onPeriodChange }) => {
  const [chartData, setChartData] = useState([]);
  const [debug, setDebug] = useState({});

  // Function to get period key for grouping
  const getPeriodKey = (dateStr, period) => {
    const date = new Date(dateStr);
    if (!date || isNaN(date.getTime())) return 'Unknown';

    switch (period) {
      case 'yearly':
        return date.getFullYear().toString();
      case 'monthly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'daily':
        return date.toISOString().split('T')[0];
      default:
        return date.getFullYear().toString();
    }
  };

  // Function to format period label
  const formatPeriodLabel = (key, period) => {
    if (key === 'Unknown') return key;

    switch (period) {
      case 'yearly':
        return key;
      case 'monthly': {
        const [year, month] = key.split('-');
        return `${new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }
      case 'daily': {
        const date = new Date(key);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      default:
        return key;
    }
  };

  // Function to get days in month
  const getDaysInMonth = (year, month) => {
    // Month is 0-indexed in JavaScript Date
    return new Date(year, month + 1, 0).getDate();
  };

  // Function to get days in year
  const getDaysInYear = (year) => {
    return ((year % 4 === 0 && year % 100 > 0) || year % 400 === 0) ? 366 : 365;
  };

  // Generate all possible periods between start and end dates
  const generateAllPeriods = (startDate, endDate, periodType) => {
    if (!startDate || !endDate) return [];

    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      switch (periodType) {
        case 'yearly':
          periods.push(current.getFullYear().toString());
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'monthly':
          periods.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`);
          current.setMonth(current.getMonth() + 1);
          break;
        case 'daily':
          periods.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
          break;
      }
    }
    return periods;
  };

  // Extract page data from a book safely
  const getBookPageSplit = (book) => {
    let pageValue = 0;

    if (book.page_split !== undefined && book.page_split !== null) {
      pageValue = parseFloat(book.page_split);
    }

    // Ensure we have a valid number
    if (isNaN(pageValue)) pageValue = 0;

    return pageValue;
  };

  // Process data for the chart
  useEffect(() => {
    if (!data || data.length === 0 || !dateRange.startDate || !dateRange.endDate) {
      setChartData([]);
      return;
    }

    // For debugging purposes
    const debugInfo = {
      totalBooks: data.length,
      dateRange: dateRange,
      sampleBook: data.length > 0 ? data[0] : null,
      bookProperties: data.length > 0 ? Object.keys(data[0]) : []
    };
    setDebug(debugInfo);

    // Filter data based on date range
    const filteredData = data.filter(item => {
      if (!item.timestamp || !(item.timestamp instanceof Date) || isNaN(item.timestamp.getTime())) {
        return false;
      }

      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return item.timestamp >= start && item.timestamp <= end;
    });

    // Group by period
    const groupedByPeriod = {};
    filteredData.forEach(book => {
      const periodKey = getPeriodKey(book.timestamp, selectedPeriod);
      if (!groupedByPeriod[periodKey]) {
        groupedByPeriod[periodKey] = [];
      }
      groupedByPeriod[periodKey].push(book);
    });

    // Get all periods in the range
    const allPeriods = generateAllPeriods(dateRange.startDate, dateRange.endDate, selectedPeriod);

    // Log data for the last 3 months for verification
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based

    // Calculate the last 3 months relative to current date
    const last3MonthKeys = [];
    for (let i = 0; i < 3; i++) {
      let year = currentYear;
      let month = currentMonth - i;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      last3MonthKeys.push(monthKey);
    }

    console.log("=== DETAILED DEBUG: Reading pace for the last 3 months ===");
    last3MonthKeys.forEach(monthKey => {
      const entriesInMonth = groupedByPeriod[monthKey] || [];
      const [year, month] = monthKey.split('-').map(Number);
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

      if (entriesInMonth.length > 0) {
        // Sum all page_split values for this month
        const totalPageSplit = entriesInMonth.reduce((sum, entry) => sum + getBookPageSplit(entry), 0);

        // Get days in this month
        const daysInMonth = getDaysInMonth(year, month - 1);

        // Calculate pages per day
        const pagesPerDay = totalPageSplit / daysInMonth;

        console.log(`\n📚 ${monthName} ${year}:`);
        console.log(`  - Total page_split: ${Math.round(totalPageSplit)} pages`);
        console.log(`  - Days in month: ${daysInMonth} days`);
        console.log(`  - Pages per day: ${pagesPerDay.toFixed(2)} pages/day`);
        console.log(`  - Number of entries: ${entriesInMonth.length}`);

        // Log detailed information about entries if needed
        if (entriesInMonth.length > 0) {
          console.log(`  - Sample entries: ${entriesInMonth.length > 3 ? '(showing first 3)' : ''}`);
          const samplesToShow = entriesInMonth.slice(0, 3);

          samplesToShow.forEach((entry, index) => {
            console.log(`    Entry ${index + 1}: ${entry.title} - ${getBookPageSplit(entry)} pages on ${entry.timestamp.toLocaleDateString()}`);
          });
        }
      } else {
        console.log(`\n📚 ${monthName} ${year}: No reading data`);
      }
    });

    // Calculate pages per period for the chart data
    const aggregatedData = allPeriods.map(periodKey => {
      const entriesInPeriod = groupedByPeriod[periodKey] || [];

      if (entriesInPeriod.length === 0) {
        return {
          period: formatPeriodLabel(periodKey, selectedPeriod),
          pagesPerDay: 0,
          totalPages: 0,
          entryCount: 0,
          rawPeriod: periodKey
        };
      }

      // Sum all page_split values for this period
      const totalPages = entriesInPeriod.reduce((sum, entry) => sum + getBookPageSplit(entry), 0);

      let pagesPerDay = totalPages; // Default for daily view (no division)
      let daysInPeriod = 1;

      // Apply the division logic based on selected period
      if (selectedPeriod === 'monthly') {
        // Extract year and month from period key
        const [year, month] = periodKey.split('-').map(Number);
        daysInPeriod = getDaysInMonth(year, month - 1); // Adjust month to 0-indexed
        pagesPerDay = totalPages / daysInPeriod;
      } else if (selectedPeriod === 'yearly') {
        // Extract year from period key
        const year = parseInt(periodKey);
        daysInPeriod = getDaysInYear(year);
        pagesPerDay = totalPages / daysInPeriod;
      }
      // For daily view, pagesPerDay = totalPages (already set)

      return {
        period: formatPeriodLabel(periodKey, selectedPeriod),
        pagesPerDay: Math.round(pagesPerDay * 100) / 100, // Round to 2 decimal places
        totalPages: Math.round(totalPages),
        daysInPeriod: daysInPeriod,
        entryCount: entriesInPeriod.length,
        rawPeriod: periodKey
      };
    });

    setChartData(aggregatedData);
  }, [data, selectedPeriod, dateRange]);

  // Get title based on selected period
  const getChartTitle = () => {
    switch (selectedPeriod) {
      case 'yearly':
        return 'Average Pages per Day by Year';
      case 'monthly':
        return 'Average Pages per Day by Month';
      case 'daily':
        return 'Total Pages Read by Day';
      default:
        return 'Reading Pace';
    }
  };

  return (
    <div className="reading-pace-chart-container">
      <div className="chart-header">
        <h2 className="reading-pace-chart__title">
          {getChartTitle()}
        </h2>
        <div className="chart-filter">
          <label htmlFor="period-select">Period:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="filter-select"
          >
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      {/* Debug information during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
          <div>Total Entries: {debug.totalBooks}</div>
          <div>Data Range: {dateRange.startDate} to {dateRange.endDate}</div>
          <div>Showing data for {chartData.filter(d => d.pagesPerDay > 0).length} periods</div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} className="reading-pace-chart__graph">
          <CartesianGrid strokeDasharray="3 3" className="reading-pace-chart__grid" />
          <XAxis
            dataKey="period"
            angle={selectedPeriod === 'monthly' || selectedPeriod === 'daily' ? -45 : 0}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            interval={selectedPeriod === 'daily' ? 6 : 0} // Skip labels for daily view
            className="reading-pace-chart__axis reading-pace-chart__axis--x"
          />
          <YAxis
            tickFormatter={(value) => value.toLocaleString()}
            className="reading-pace-chart__axis reading-pace-chart__axis--y"
          />
          <Tooltip
            formatter={(value, name) => {
              if (selectedPeriod === 'daily') {
                return [`${value.toLocaleString()} pages`, 'Total Pages'];
              }
              return [`${value.toLocaleString()} pages/day`, 'Pages per Day'];
            }}
            className="reading-pace-chart__tooltip"
          />
          <Legend className="reading-pace-chart__legend" />
          <Bar
            dataKey="pagesPerDay"
            name={selectedPeriod === 'daily' ? 'Total Pages' : 'Pages per Day'}
            fill="#EAC435"
            className="reading-pace-chart__bar"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReadingPaceChart;
