// const pool = require('../config/level_database');
const pool = require('../config/database');
const getTransactionStats = async (req, res) => {
  try {
    const {
      startDate = '',
      endDate = '',
      planType = '',
      deviceType = '',
      paymentMethod = ''
    } = req.query;

    console.log('🔄 Getting enhanced transaction statistics...');
    console.log('Date filters:', { startDate, endDate });

    // Build WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate && startDate !== '') {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }

    if (endDate && endDate !== '') {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }

    if (planType && planType !== '') {
      whereClause += ' AND plan_type = ?';
      params.push(planType);
    }

    if (deviceType && deviceType !== '') {
      whereClause += ' AND device_type = ?';
      params.push(parseInt(deviceType));
    }

    if (paymentMethod && paymentMethod !== '') {
      whereClause += ' AND payment_method = ?';
      params.push(paymentMethod);
    }

    // 1. Basic Overview Stats
    const [overviewStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status IN ('completed', 'success') THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        AVG(CASE WHEN status IN ('completed', 'success') THEN amount ELSE NULL END) as avg_transaction_amount
      FROM new_transactions 
      ${whereClause}
    `, params);

    // 2. Revenue by Currency (Fixed calculation) - Filter valid currencies only
    const [revenueStats] = await pool.execute(`
      SELECT 
        COALESCE(local_currency, currency, 'USD') as currency_code,
        SUM(CASE 
          WHEN status IN ('completed', 'success') THEN 
            COALESCE(local_amount, amount, 0)
          ELSE 0 
        END) as total_revenue,
        COUNT(CASE WHEN status IN ('completed', 'success') THEN 1 END) as successful_count
      FROM new_transactions 
      ${whereClause}
      AND COALESCE(local_currency, currency, 'USD') REGEXP '^[A-Z]{3}$'
      GROUP BY COALESCE(local_currency, currency, 'USD')
      ORDER BY total_revenue DESC
    `, params);

    // Calculate total revenue across all currencies
    const totalRevenue = revenueStats.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);

    // 3. New vs Repeat Transactions (based on user_id occurrence)
    const [newVsRepeatStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN user_purchase_count = 1 THEN user_purchase_count ELSE 0 END) as new_transactions,
        SUM(CASE WHEN user_purchase_count > 1 THEN user_purchase_count ELSE 0 END) as repeat_transactions,
        COUNT(CASE WHEN user_purchase_count > 1 THEN 1 END) as unique_repeat_users,
        COUNT(CASE WHEN user_purchase_count = 1 THEN 1 END) as unique_new_users
      FROM (
        SELECT 
          user_id,
          COUNT(*) as user_purchase_count
        FROM new_transactions 
        ${whereClause}
        GROUP BY user_id
      ) as user_stats
    `, params);

    // 4. Platform/Device Statistics  
    const [platformStats] = await pool.execute(`
      SELECT 
        device_type,
        COUNT(*) as count,
        SUM(CASE 
          WHEN status IN ('completed', 'success') THEN 
            COALESCE(local_amount, amount, 0)
          ELSE 0 
        END) as revenue
      FROM new_transactions
      ${whereClause}
      GROUP BY device_type
      ORDER BY count DESC
    `, params);

    // 5. Plan Type with Repeat/New User Breakdown - UPDATED to include astro_report
    const [planTypeUserBreakdown] = await pool.execute(`
      SELECT 
        CASE 
          WHEN plan_type LIKE '%monthly%' OR plan_type LIKE '%month%' OR plan_type = 'monthly' THEN 'monthly'
          WHEN plan_type LIKE '%half%' OR plan_type LIKE '%6%' OR plan_type LIKE '%semi%' THEN 'half_yearly'
          WHEN plan_type LIKE '%yearly%' OR plan_type LIKE '%year%' OR plan_type LIKE '%annual%' OR plan_type = 'yearly' THEN 'yearly'
          WHEN plan_type LIKE '%astro%' OR plan_type = 'astro_report' OR plan_type = 'astro report' THEN 'astro_report'
          ELSE 'other'
        END as plan_category,
        SUM(CASE WHEN user_purchase_count = 1 THEN user_purchase_count ELSE 0 END) as new_transactions,
        SUM(CASE WHEN user_purchase_count > 1 THEN user_purchase_count ELSE 0 END) as repeat_transactions,
        COUNT(CASE WHEN user_purchase_count = 1 THEN 1 END) as unique_new_users,
        COUNT(CASE WHEN user_purchase_count > 1 THEN 1 END) as unique_repeat_users
      FROM (
        SELECT 
          plan_type,
          user_id,
          COUNT(*) as user_purchase_count
        FROM new_transactions 
        ${whereClause}
        AND plan_type IS NOT NULL
        GROUP BY plan_type, user_id
      ) as user_plan_stats
      GROUP BY CASE 
        WHEN plan_type LIKE '%monthly%' OR plan_type LIKE '%month%' OR plan_type = 'monthly' THEN 'monthly'
        WHEN plan_type LIKE '%half%' OR plan_type LIKE '%6%' OR plan_type LIKE '%semi%' THEN 'half_yearly'
        WHEN plan_type LIKE '%yearly%' OR plan_type LIKE '%year%' OR plan_type LIKE '%annual%' OR plan_type = 'yearly' THEN 'yearly'
        WHEN plan_type LIKE '%astro%' OR plan_type = 'astro_report' OR plan_type = 'astro report' THEN 'astro_report'
        ELSE 'other'
      END
    `, params);

    // 6. Plan Type Summary - UPDATED to include astro_report
    const [planBreakdown] = await pool.execute(`
      SELECT 
        -- Monthly plans
        SUM(CASE 
          WHEN plan_type LIKE '%monthly%' OR plan_type LIKE '%month%' OR plan_type = 'monthly' 
          THEN 1 ELSE 0 
        END) as monthly_count,
        SUM(CASE 
          WHEN (plan_type LIKE '%monthly%' OR plan_type LIKE '%month%' OR plan_type = 'monthly') 
          AND status IN ('completed', 'success')
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as monthly_revenue,
        
        -- Half-yearly plans  
        SUM(CASE 
          WHEN plan_type LIKE '%half%' OR plan_type LIKE '%6%' OR plan_type LIKE '%semi%'
          THEN 1 ELSE 0 
        END) as half_yearly_count,
        SUM(CASE 
          WHEN (plan_type LIKE '%half%' OR plan_type LIKE '%6%' OR plan_type LIKE '%semi%')
          AND status IN ('completed', 'success')
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as half_yearly_revenue,
        
        -- Yearly plans
        SUM(CASE 
          WHEN plan_type LIKE '%yearly%' OR plan_type LIKE '%year%' OR plan_type LIKE '%annual%' OR plan_type = 'yearly'
          THEN 1 ELSE 0 
        END) as yearly_count,
        SUM(CASE 
          WHEN (plan_type LIKE '%yearly%' OR plan_type LIKE '%year%' OR plan_type LIKE '%annual%' OR plan_type = 'yearly')
          AND status IN ('completed', 'success')
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as yearly_revenue,
        
        -- Astro Report plans - NEW
        SUM(CASE 
          WHEN plan_type LIKE '%astro%' OR plan_type = 'astro_report' OR plan_type = 'astro report'
          THEN 1 ELSE 0 
        END) as astro_report_count,
        SUM(CASE 
          WHEN (plan_type LIKE '%astro%' OR plan_type = 'astro_report' OR plan_type = 'astro report')
          AND status IN ('completed', 'success')
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as astro_report_revenue,
        
        -- Total revenue for plan breakdown
        SUM(CASE 
          WHEN status IN ('completed', 'success') 
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as total_revenue
      FROM new_transactions
      ${whereClause}
    `, params);

    // 7. Payment Method Statistics
    const [paymentMethodStats] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COUNT(CASE WHEN status IN ('completed', 'success') THEN 1 END) as successful_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM new_transactions
      ${whereClause}
      AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY count DESC
    `, params);

    // 8. Recent transaction trend (last 30 days comparison)
    const [trendStats] = await pool.execute(`
      SELECT 
        'last_30_days' as period,
        COUNT(*) as transaction_count,
        SUM(CASE 
          WHEN status IN ('completed', 'success') 
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as revenue
      FROM new_transactions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      UNION ALL
      SELECT 
        'previous_30_days' as period,
        COUNT(*) as transaction_count, 
        SUM(CASE 
          WHEN status IN ('completed', 'success') 
          THEN COALESCE(local_amount, amount, 0) ELSE 0 
        END) as revenue
      FROM new_transactions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) 
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Calculate growth rates
    const last30Days = trendStats.find(t => t.period === 'last_30_days') || { transaction_count: 0, revenue: 0 };
    const previous30Days = trendStats.find(t => t.period === 'previous_30_days') || { transaction_count: 0, revenue: 0 };
    
    const transactionGrowth = previous30Days.transaction_count > 0 ? 
      ((last30Days.transaction_count - previous30Days.transaction_count) / previous30Days.transaction_count * 100).toFixed(2) : 0;
    
    const revenueGrowth = previous30Days.revenue > 0 ?
      ((last30Days.revenue - previous30Days.revenue) / previous30Days.revenue * 100).toFixed(2) : 0;

    // Create revenue by currency object
    const revenueByCurrency = {};
    revenueStats.forEach(row => {
      if (row.total_revenue > 0) {
        revenueByCurrency[row.currency_code] = parseFloat(row.total_revenue);
      }
    });

    // Process plan type user breakdown - UPDATED to include astro_report
    const planTypeBreakdown = {
      monthly: { new_transactions: 0, repeat_transactions: 0, unique_new_users: 0, unique_repeat_users: 0 },
      half_yearly: { new_transactions: 0, repeat_transactions: 0, unique_new_users: 0, unique_repeat_users: 0 },
      yearly: { new_transactions: 0, repeat_transactions: 0, unique_new_users: 0, unique_repeat_users: 0 },
      astro_report: { new_transactions: 0, repeat_transactions: 0, unique_new_users: 0, unique_repeat_users: 0 }
    };

    planTypeUserBreakdown.forEach(row => {
      if (row.plan_category !== 'other') {
        planTypeBreakdown[row.plan_category] = {
          new_transactions: parseInt(row.new_transactions || 0),
          repeat_transactions: parseInt(row.repeat_transactions || 0),
          unique_new_users: parseInt(row.unique_new_users || 0),
          unique_repeat_users: parseInt(row.unique_repeat_users || 0)
        };
      }
    });

    // Compile comprehensive statistics
    const stats = {
      // Main Cards Data
      overview: {
        total_transactions: parseInt(overviewStats[0].total_transactions),
        total_revenue: totalRevenue,
        failed_transactions: parseInt(overviewStats[0].failed_transactions),
        pending_transactions: parseInt(overviewStats[0].pending_transactions),
        successful_transactions: parseInt(overviewStats[0].successful_transactions),
        avg_transaction_amount: parseFloat(overviewStats[0].avg_transaction_amount || 0),
        success_rate: overviewStats[0].total_transactions > 0 ? 
          (overviewStats[0].successful_transactions / overviewStats[0].total_transactions * 100).toFixed(2) : 0,
        failure_rate: overviewStats[0].total_transactions > 0 ? 
          (overviewStats[0].failed_transactions / overviewStats[0].total_transactions * 100).toFixed(1) : 0
      },

      // Revenue by Currency (for multi-currency display)
      revenue_by_currency: revenueByCurrency,

      // New vs Repeat Customers
      customer_type: {
        new_transactions: parseInt(newVsRepeatStats[0].new_transactions || 0),
        repeat_transactions: parseInt(newVsRepeatStats[0].repeat_transactions || 0),
        unique_repeat_users: parseInt(newVsRepeatStats[0].unique_repeat_users || 0),
        unique_new_users: parseInt(newVsRepeatStats[0].unique_new_users || 0),
        new_customer_percentage: newVsRepeatStats[0].new_transactions > 0 && overviewStats[0].total_transactions > 0 ?
          (newVsRepeatStats[0].new_transactions / overviewStats[0].total_transactions * 100).toFixed(2) : 0
      },

      // Platform Distribution
      by_platform: platformStats.map(row => ({
        device_type: parseInt(row.device_type),
        platform_name: row.device_type == 1 ? 'Android' : row.device_type == 2 ? 'iOS' : row.device_type == 3 ? 'Web' : 'Other',
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue || 0),
        percentage: overviewStats[0].total_transactions > 0 ?
          (row.count / overviewStats[0].total_transactions * 100).toFixed(1) : 0
      })),

      // Plan Type Breakdown - UPDATED to include astro_report
      plan_breakdown: {
        monthly_count: parseInt(planBreakdown[0].monthly_count || 0),
        monthly_revenue: parseFloat(planBreakdown[0].monthly_revenue || 0),
        half_yearly_count: parseInt(planBreakdown[0].half_yearly_count || 0),
        half_yearly_revenue: parseFloat(planBreakdown[0].half_yearly_revenue || 0),
        yearly_count: parseInt(planBreakdown[0].yearly_count || 0),
        yearly_revenue: parseFloat(planBreakdown[0].yearly_revenue || 0),
        astro_report_count: parseInt(planBreakdown[0].astro_report_count || 0),
        astro_report_revenue: parseFloat(planBreakdown[0].astro_report_revenue || 0),
        total_revenue: parseFloat(planBreakdown[0].total_revenue || 0),
        // Add user breakdown by plan type
        monthly_user_breakdown: planTypeBreakdown.monthly,
        half_yearly_user_breakdown: planTypeBreakdown.half_yearly,
        yearly_user_breakdown: planTypeBreakdown.yearly,
        astro_report_user_breakdown: planTypeBreakdown.astro_report
      },

      // Payment Method Distribution
      by_payment_method: paymentMethodStats.map(row => ({
        payment_method: row.payment_method,
        count: parseInt(row.count),
        successful_count: parseInt(row.successful_count),
        failed_count: parseInt(row.failed_count),
        success_rate: row.count > 0 ? (row.successful_count / row.count * 100).toFixed(1) : 0
      })),

      // Growth Metrics
      growth: {
        transaction_growth_30d: parseFloat(transactionGrowth),
        revenue_growth_30d: parseFloat(revenueGrowth),
        is_transaction_growth_positive: parseFloat(transactionGrowth) > 0,
        is_revenue_growth_positive: parseFloat(revenueGrowth) > 0
      },

      // Applied Filters
      applied_filters: {
        startDate,
        endDate,
        planType,
        deviceType,
        paymentMethod
      }
    };

    console.log('✅ Enhanced transaction statistics retrieved successfully');
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error in getTransactionStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction statistics',
      error: error.message,
      code: error.code
    });
  }
};

// Rest of the functions remain the same...
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      startDate = '',
      endDate = '',
      planType = '',
      deviceType = '',
      status = '',
      paymentMethod = '',
      localCurrency = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offsetInt = (pageInt - 1) * limitInt;

    let query = `
      SELECT 
        id,
        transaction_id,
        user_id,
        amount,
        plan_type,
        premium_started_on,
        premium_ends_on,
        created_at,
        device_type,
        payment_method,
        original_transaction_id,
        status,
        currency,
        local_currency,
        local_amount,
        ad_name
      FROM new_transactions
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim()) {
      query += ` AND (
        transaction_id LIKE ? OR 
        user_id LIKE ? OR 
        plan_type LIKE ? OR
        payment_method LIKE ? OR
        status LIKE ? OR
        ad_name LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (startDate && startDate !== '') {
      query += ` AND DATE(created_at) >= ?`;
      params.push(startDate);
    }

    if (endDate && endDate !== '') {
      query += ` AND DATE(created_at) <= ?`;
      params.push(endDate);
    }

    if (planType && planType !== '') {
      query += ` AND plan_type = ?`;
      params.push(planType);
    }

    if (deviceType && deviceType !== '') {
      query += ` AND device_type = ?`;
      params.push(parseInt(deviceType));
    }

    if (status && status !== '') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (paymentMethod && paymentMethod !== '') {
      query += ` AND payment_method = ?`;
      params.push(paymentMethod);
    }

    if (localCurrency && localCurrency !== '') {
      query += ` AND (local_currency = ? OR currency = ?)`;
      params.push(localCurrency, localCurrency);
    }

    const allowedSortFields = ['created_at', 'amount', 'premium_started_on', 'plan_type', 'status', 'id'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ${limitInt} OFFSET ${offsetInt}`;

    const [dataRows] = await pool.execute(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM new_transactions WHERE 1=1`;
    const countParams = [];

    if (search && search.trim()) {
      countQuery += ` AND (
        transaction_id LIKE ? OR 
        user_id LIKE ? OR 
        plan_type LIKE ? OR
        payment_method LIKE ? OR
        status LIKE ? OR
        ad_name LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (startDate && startDate !== '') {
      countQuery += ` AND DATE(created_at) >= ?`;
      countParams.push(startDate);
    }

    if (endDate && endDate !== '') {
      countQuery += ` AND DATE(created_at) <= ?`;
      countParams.push(endDate);
    }

    if (planType && planType !== '') {
      countQuery += ` AND plan_type = ?`;
      countParams.push(planType);
    }

    if (deviceType && deviceType !== '') {
      countQuery += ` AND device_type = ?`;
      countParams.push(parseInt(deviceType));
    }

    if (status && status !== '') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    if (paymentMethod && paymentMethod !== '') {
      countQuery += ` AND payment_method = ?`;
      countParams.push(paymentMethod);
    }

    if (localCurrency && localCurrency !== '') {
      countQuery += ` AND (local_currency = ? OR currency = ?)`;
      countParams.push(localCurrency, localCurrency);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    const formattedData = dataRows.map(row => ({
      ...row,
      amount: parseInt(row.amount),
      local_amount: parseFloat(row.local_amount || 0),
      device_type: parseInt(row.device_type || 0),
      premium_started_on: row.premium_started_on,
      premium_ends_on: row.premium_ends_on
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt),
        hasNext: pageInt * limitInt < total,
        hasPrev: pageInt > 1
      }
    });

  } catch (error) {
    console.error('❌ Error in getTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
      code: error.code
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM new_transactions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    const transaction = {
      ...rows[0],
      amount: parseInt(rows[0].amount),
      local_amount: parseFloat(rows[0].local_amount || 0),
      device_type: parseInt(rows[0].device_type || 0)
    };
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transaction', error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const [result] = await pool.execute(
      `UPDATE new_transactions 
       SET amount = ?, plan_type = ?, device_type = ?, payment_method = ?, 
           status = ?, currency = ?, local_currency = ?, local_amount = ?, 
           ad_name = ?, premium_started_on = ?, premium_ends_on = ?
       WHERE id = ?`,
      [
        updateData.amount, updateData.plan_type, updateData.device_type, updateData.payment_method,
        updateData.status, updateData.currency, updateData.local_currency, updateData.local_amount,
        updateData.ad_name, updateData.premium_started_on, updateData.premium_ends_on, id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating transaction', error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM new_transactions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting transaction', error: error.message });
  }
};

const getTransactionSegmentAnalysis = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // This is a complex query that would analyze user payment patterns
    // For now, I'll provide the structure - you'll need to adapt based on your actual data schema
    const segmentQuery = `
      WITH first_payment_days AS (
        SELECT 
          user_id,
          MIN(DATEDIFF(created_at, user_registration_date)) as days_to_first_payment,
          COUNT(*) as total_transactions,
          SUM(amount) as total_revenue
        FROM new_transactions 
        WHERE status IN ('completed', 'success')
        GROUP BY user_id
      ),
      segment_classification AS (
        SELECT 
          *,
          CASE 
            WHEN days_to_first_payment = 0 THEN 'Day 1'
            WHEN days_to_first_payment BETWEEN 1 AND 4 THEN 'Day 2 - 5'
            WHEN days_to_first_payment BETWEEN 5 AND 6 THEN 'Day 5 - 7'
            WHEN days_to_first_payment BETWEEN 7 AND 9 THEN 'Day 7 - 10'
            WHEN days_to_first_payment BETWEEN 10 AND 14 THEN 'Day 10 - 15'
            WHEN days_to_first_payment BETWEEN 15 AND 19 THEN 'Day 15 - 20'
            WHEN days_to_first_payment BETWEEN 20 AND 29 THEN 'Day 20 - 30'
            ELSE 'Day 30+'
          END as segment
        FROM first_payment_days
      )
      SELECT 
        segment,
        COUNT(*) as users,
        SUM(total_transactions) as transactions,
        SUM(total_revenue) as revenue,
        AVG(total_revenue) as avg_revenue,
        (COUNT(*) / (SELECT COUNT(*) FROM segment_classification) * 100) as conversion_rate
      FROM segment_classification
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'Day 1' THEN 1
          WHEN 'Day 2 - 5' THEN 2
          WHEN 'Day 5 - 7' THEN 3
          WHEN 'Day 7 - 10' THEN 4
          WHEN 'Day 10 - 15' THEN 5
          WHEN 'Day 15 - 20' THEN 6
          WHEN 'Day 20 - 30' THEN 7
          ELSE 8
        END
    `;
    
    const [segments] = await pool.execute(segmentQuery);
    
    // Calculate totals
    const totalUsers = segments.reduce((sum, seg) => sum + parseInt(seg.users), 0);
    const totalTransactions = segments.reduce((sum, seg) => sum + parseInt(seg.transactions), 0);
    const totalRevenue = segments.reduce((sum, seg) => sum + parseFloat(seg.revenue), 0);
    
    const result = {
      transactionId: parseInt(transactionId),
      segments: segments.map(seg => ({
        label: seg.segment,
        days: seg.segment.replace('Day ', ''),
        users: parseInt(seg.users),
        transactions: parseInt(seg.transactions),
        revenue: parseFloat(seg.revenue),
        conversionRate: parseFloat(seg.conversion_rate),
        avgRevenue: parseFloat(seg.avg_revenue)
      })),
      totalUsers,
      totalTransactions,
      totalRevenue
    };
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching segment analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching segment analysis',
      error: error.message
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionSegmentAnalysis
};