// src/pages/Health/HealthPage.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Heart, Target, TrendingUp } from 'lucide-react';
import './HealthPage.css';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useData } from '../../context/DataContext';

// Import components
import CardsPanel from '../../components/ui/CardsPanel/CardsPanel';
import FilteringPanel from '../../components/ui/Filters/FilteringPanel/FilteringPanel';

const HealthPage = () => {
  const { data, loading, error, fetchData } = useData();
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);

  // Fetch health data on component mount
  useEffect(() => {
    console.log('🏥 HealthPage: Starting to fetch health data');
    console.log('🏥 Current data state:', data);
    console.log('🏥 Loading state:', loading);
    console.log('🏥 Error state:', error);
    fetchData('health');
  }, [fetchData]);

  // Update filtered data when data or filters change
  useEffect(() => {
    console.log('🏥 HealthPage: Processing data.health:', data.health);
    if (data.health) {
      console.log('🏥 HealthPage: Health data length:', data.health.length);
      console.log('🏥 HealthPage: First few records:', data.health.slice(0, 3));
      
      let filtered = [...data.health];

      // Apply date range filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        filtered = filtered.filter(item => {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          return itemDate >= start && itemDate <= end;
        });
      }

      console.log('🏥 HealthPage: Filtered data length:', filtered.length);
      setFilteredData(filtered);
    } else {
      console.log('🏥 HealthPage: No health data available');
      setFilteredData([]);
    }
  }, [data.health, filters]);

  // Filter configuration
  const filterConfigs = [
    {
      key: 'dateRange',
      type: 'daterange',
      label: 'Date Range',
      dataField: 'date',
      icon: <Calendar size={16} />,
      placeholder: 'Select date range'
    }
  ];

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Generate summary cards data
  const generateCardsData = () => {
    if (!filteredData.length) return [];

    // Calculate basic statistics
    const totalRecords = filteredData.length;
    
    // Calculate average steps (filter out null/undefined values)
    const stepData = filteredData.filter(item => item.step_count && !isNaN(parseFloat(item.step_count)));
    const avgSteps = stepData.length > 0 
      ? Math.round(stepData.reduce((sum, item) => sum + parseFloat(item.step_count), 0) / stepData.length)
      : 0;

    // Calculate average heart rate
    const heartRateData = filteredData.filter(item => item.heart_rate && !isNaN(parseFloat(item.heart_rate)));
    const avgHeartRate = heartRateData.length > 0
      ? Math.round(heartRateData.reduce((sum, item) => sum + parseFloat(item.heart_rate), 0) / heartRateData.length)
      : 0;

    // Calculate date range
    const dates = filteredData.filter(item => item.date).map(item => new Date(item.date));
    const dateRange = dates.length > 0 
      ? `${Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24))} days`
      : '0 days';

    return [
      {
        value: totalRecords.toLocaleString(),
        label: "Total Records",
        icon: <Activity size={24} />
      },
      {
        value: avgSteps.toLocaleString(),
        label: "Average Steps",
        icon: <Target size={24} />
      },
      {
        value: avgHeartRate > 0 ? `${avgHeartRate} bpm` : 'No data',
        label: "Average Heart Rate",
        icon: <Heart size={24} />
      },
      {
        value: dateRange,
        label: "Date Range",
        icon: <TrendingUp size={24} />
      }
    ];
  };

  const cardsData = generateCardsData();

  // Loading state
  if (loading.health) {
    return <LoadingSpinner centerIcon={Activity} />;
  }

  // Error state
  if (error.health) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Health Dashboard</h1>
          <div className="error">
            Error loading health data: {error.health}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data.health || data.health.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content">
          <h1>Health Dashboard</h1>
          <div className="empty-state">
            <Activity size={48} className="empty-state-icon" />
            <p className="empty-state-message">
              No health data available. Health data will appear here once it's processed and uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Health Dashboard</h1>
        <p className="page-description">Monitor your health and fitness metrics over time</p>

        {/* Summary Cards */}
        <CardsPanel
          title="Health Statistics"
          description="Your health metrics at a glance"
          cards={cardsData}
          loading={loading.health}
        />

        {/* Filters */}
        <FilteringPanel
          data={data.health}
          filterConfigs={filterConfigs}
          onFiltersChange={handleFiltersChange}
          title="Health Filters"
          description="Filter your health data by date range and metrics"
        />

        {/* Filtered Data Preview */}
        <div className="data-preview">
          <h3>Filtered Health Data</h3>
          <p>Showing {filteredData.length} records</p>
          {filteredData.length > 0 && (
            <div className="data-sample">
              <p><strong>Date range:</strong> {new Date(filteredData[0].date).toLocaleDateString()} - {new Date(filteredData[filteredData.length - 1].date).toLocaleDateString()}</p>
              <p><strong>Available metrics:</strong> {Object.keys(filteredData[0]).filter(key => key !== 'date' && filteredData[0][key] !== '' && filteredData[0][key] !== null).join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthPage;