import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';

const TransactionDetails = ({ transactionId, onBack }) => {
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSegmentData();
  }, [transactionId]);

  const fetchSegmentData = async () => {
    try {
      setLoading(true);
      // This would be your API call to get segment data
      // For now, I'll create mock data structure
      const mockData = {
        transactionId,
        segments: [
          {
            label: 'Day 1',
            days: '1',
            users: 1250,
            transactions: 1250,
            revenue: 45000,
            conversionRate: 100,
            avgRevenue: 36
          },
          {
            label: 'Day 2 - 5',
            days: '2-5',
            users: 890,
            transactions: 1020,
            revenue: 38400,
            conversionRate: 71.2,
            avgRevenue: 43.15
          },
          {
            label: 'Day 5 - 7',
            days: '5-7',
            users: 445,
            transactions: 502,
            revenue: 19800,
            conversionRate: 35.6,
            avgRevenue: 44.48
          },
          {
            label: 'Day 7 - 10',
            days: '7-10',
            users: 320,
            transactions: 355,
            revenue: 15200,
            conversionRate: 25.6,
            avgRevenue: 47.5
          },
          {
            label: 'Day 10 - 15',
            days: '10-15',
            users: 210,
            transactions: 225,
            revenue: 11250,
            conversionRate: 16.8,
            avgRevenue: 53.57
          },
          {
            label: 'Day 15 - 20',
            days: '15-20',
            users: 145,
            transactions: 152,
            revenue: 7980,
            conversionRate: 11.6,
            avgRevenue: 55.03
          },
          {
            label: 'Day 20 - 30',
            days: '20-30',
            users: 98,
            transactions: 105,
            revenue: 5670,
            conversionRate: 7.84,
            avgRevenue: 57.86
          },
          {
            label: 'Day 30+',
            days: '30+',
            users: 75,
            transactions: 82,
            revenue: 4920,
            conversionRate: 6.0,
            avgRevenue: 65.6
          }
        ],
        totalUsers: 3433,
        totalRevenue: 148220,
        totalTransactions: 3691
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSegmentData(mockData);
    } catch (err) {
      setError('Failed to load segment data');
      console.error('Error fetching segment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${Number(num || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        <span style={{ color: '#64748b', fontSize: '1rem' }}>Loading segment analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#ef4444',
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          {error}
        </div>
        <button 
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const maxUsers = Math.max(...segmentData.segments.map(s => s.users));
  const maxRevenue = Math.max(...segmentData.segments.map(s => s.revenue));

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button 
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374155'
          }}
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </button>
        
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            Payment Segment Analysis
          </h1>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Transaction ID: #{transactionId} • Analysis by first payment timing
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={16} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
              Total Users
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {formatNumber(segmentData.totalUsers)}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
              Total Transactions
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {formatNumber(segmentData.totalTransactions)}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
              Total Revenue
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {formatCurrency(segmentData.totalRevenue)}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BarChart3 size={16} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
              Avg Revenue/User
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {formatCurrency(segmentData.totalRevenue / segmentData.totalUsers)}
          </div>
        </div>
      </div>

      {/* Segment Analysis Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#3b82f6' }} />
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Payment Segments by First Payment Timing
            </h2>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '4px 0 0 0'
          }}>
            User behavior analysis based on when they made their first payment
          </p>
        </div>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 120px 120px 120px 120px 120px 200px',
          gap: '16px',
          padding: '16px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#475569'
        }}>
          <div>Time Segment</div>
          <div style={{ textAlign: 'center' }}>Users</div>
          <div style={{ textAlign: 'center' }}>Transactions</div>
          <div style={{ textAlign: 'center' }}>Revenue</div>
          <div style={{ textAlign: 'center' }}>Conv. Rate</div>
          <div style={{ textAlign: 'center' }}>Avg Revenue</div>
          <div style={{ textAlign: 'center' }}>User Distribution</div>
        </div>

        {/* Table Body */}
        {segmentData.segments.map((segment, index) => (
          <div
            key={segment.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 120px 120px 120px 120px 120px 200px',
              gap: '16px',
              padding: '16px 20px',
              borderBottom: index < segmentData.segments.length - 1 ? '1px solid #f1f5f9' : 'none',
              alignItems: 'center',
              fontSize: '0.875rem'
            }}
          >
            {/* Time Segment */}
            <div>
              <div style={{ 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '2px'
              }}>
                {segment.label}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={10} />
                Day {segment.days}
              </div>
            </div>

            {/* Users */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                {formatNumber(segment.users)}
              </div>
            </div>

            {/* Transactions */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                {formatNumber(segment.transactions)}
              </div>
            </div>

            {/* Revenue */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#059669' }}>
                {formatCurrency(segment.revenue)}
              </div>
            </div>

            {/* Conversion Rate */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '4px'
              }}>
                {index === 0 ? (
                  <span style={{ fontWeight: '600', color: '#10b981' }}>
                    {formatPercentage(segment.conversionRate)}
                  </span>
                ) : (
                  <>
                    {segment.conversionRate > segmentData.segments[index - 1]?.conversionRate ? (
                      <TrendingUp size={12} style={{ color: '#10b981' }} />
                    ) : (
                      <TrendingDown size={12} style={{ color: '#ef4444' }} />
                    )}
                    <span style={{ 
                      fontWeight: '600', 
                      color: segment.conversionRate > segmentData.segments[index - 1]?.conversionRate ? '#10b981' : '#ef4444' 
                    }}>
                      {formatPercentage(segment.conversionRate)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Avg Revenue */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '600', color: '#8b5cf6' }}>
                {formatCurrency(segment.avgRevenue)}
              </div>
            </div>

            {/* User Distribution Bar */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '24px',
                background: '#f1f5f9',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                margin: '0 auto'
              }}>
                <div style={{
                  width: `${(segment.users / maxUsers) * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, 
                    ${index === 0 ? '#10b981' : 
                      index === 1 ? '#3b82f6' : 
                      index === 2 ? '#8b5cf6' :
                      index === 3 ? '#f59e0b' :
                      index === 4 ? '#ef4444' :
                      index === 5 ? '#06b6d4' :
                      index === 6 ? '#84cc16' : '#6b7280'}, 
                    ${index === 0 ? '#059669' : 
                      index === 1 ? '#2563eb' : 
                      index === 2 ? '#7c3aed' :
                      index === 3 ? '#d97706' :
                      index === 4 ? '#dc2626' :
                      index === 5 ? '#0891b2' :
                      index === 6 ? '#65a30d' : '#4b5563'})`,
                  borderRadius: '12px',
                  transition: 'width 0.8s ease'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '8px',
                  transform: 'translateY(-50%)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {formatPercentage((segment.users / segmentData.totalUsers) * 100)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      <div style={{
        marginTop: '32px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp size={18} style={{ color: '#3b82f6' }} />
          Key Insights
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16a34a', marginBottom: '4px' }}>
              Early Adopters (Day 1)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534' }}>
              Highest volume with {formatPercentage((segmentData.segments[0].users / segmentData.totalUsers) * 100)} of total users
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d97706', marginBottom: '4px' }}>
              Revenue Per User Growth
            </div>
            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
              Later segments show higher average revenue per user
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#2563eb', marginBottom: '4px' }}>
              Retention Effect
            </div>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
              Users who wait longer tend to generate more transactions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;