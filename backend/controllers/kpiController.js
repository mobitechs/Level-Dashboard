const pool = require('../config/database');

// GET /api/kpis/dashboard - Get KPIs with date filtering
const getDashboardData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const start = startDate || defaultStartDate;
    const end = endDate || defaultEndDate;

    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.display_order as category_order,
        k.id as kpi_id,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.data_type,
        k.benchmark_value,
        k.has_platform_split,
        k.display_order as kpi_order,
        ROUND(AVG(kv.android_value), 2) as avg_android_value,
        ROUND(AVG(kv.ios_value), 2) as avg_ios_value,
        ROUND(AVG(kv.net_value), 2) as avg_net_value,
        MAX(kv.date_value) as latest_date,
        COUNT(kv.id) as data_points
      FROM categories c
      LEFT JOIN kpis k ON c.id = k.category_id AND k.is_active = 1
      LEFT JOIN kpi_values kv ON k.id = kv.kpi_id 
      WHERE kv.date_value BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.display_order, k.id, k.name, k.code, k.unit, k.data_type, k.benchmark_value, k.has_platform_split, k.display_order
      HAVING data_points > 0
      ORDER BY c.display_order, k.display_order
    `;

    const [rows] = await pool.execute(query, [start, end]);
    
    const categorizedData = {};
    
    rows.forEach(row => {
      if (!categorizedData[row.category_id]) {
        categorizedData[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          display_order: row.category_order,
          kpis: []
        };
      }
      
      if (row.kpi_id) {
        categorizedData[row.category_id].kpis.push({
          id: row.kpi_id,
          name: row.kpi_name,
          code: row.kpi_code,
          unit: row.unit,
          data_type: row.data_type,
          benchmark_value: row.benchmark_value,
          has_platform_split: row.has_platform_split,
          display_order: row.kpi_order,
          category_id: row.category_id,
          currentValues: {
            android: row.avg_android_value,
            ios: row.avg_ios_value,
            net: row.avg_net_value,
            date: row.latest_date
          },
          dataPoints: row.data_points
        });
      }
    });

    res.json({
      success: true,
      data: Object.values(categorizedData),
      dateRange: { startDate: start, endDate: end },
      totalDataPoints: rows.reduce((sum, row) => sum + row.data_points, 0)
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// GET /api/kpis/date-range - Get available date range
const getAvailableDateRange = async (req, res) => {
  try {
    const query = `
      SELECT 
        MIN(date_value) as min_date,
        MAX(date_value) as max_date,
        COUNT(DISTINCT date_value) as total_days
      FROM kpi_values
    `;

    const [rows] = await pool.execute(query);
    
    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error fetching date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching date range',
      error: error.message
    });
  }
};

const getLatestKPIs = async (req, res) => {
  try {
    const query = `
      SELECT 
        k.id,
        k.name,
        k.code,
        k.unit,
        k.benchmark_value,
        k.has_platform_split,
        kv.android_value,
        kv.ios_value,
        kv.net_value,
        kv.date_value,
        c.name as category_name,
        k.category_id
      FROM kpis k
      JOIN kpi_values kv ON k.id = kv.kpi_id
      JOIN categories c ON k.category_id = c.id
      WHERE kv.date_value = (
        SELECT MAX(date_value) FROM kpi_values WHERE kpi_id = k.id
      )
      AND k.is_active = 1
      ORDER BY c.display_order, k.display_order
    `;

    const [rows] = await pool.execute(query);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (error) {
    console.error('Error fetching latest KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest KPIs',
      error: error.message
    });
  }
};

const getKPITrend = async (req, res) => {
  try {
    const { kpiId } = req.params;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        kv.date_value,
        kv.android_value,
        kv.ios_value,
        kv.net_value,
        k.name,
        k.unit,
        k.has_platform_split
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      WHERE kv.kpi_id = ? 
      AND kv.date_value >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY kv.date_value ASC
    `;

    const [rows] = await pool.execute(query, [kpiId, days]);
    
    res.json({
      success: true,
      data: rows,
      kpiId: parseInt(kpiId),
      days: parseInt(days)
    });

  } catch (error) {
    console.error('Error fetching KPI trend:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI trend',
      error: error.message
    });
  }
};

const getWeeklyComparison = async (req, res) => {
  try {
    const query = `
      SELECT 
        k.id,
        k.name,
        k.unit,
        AVG(CASE WHEN kv.date_value >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
                 THEN COALESCE(kv.net_value, kv.android_value + kv.ios_value) END) as this_week,
        AVG(CASE WHEN kv.date_value BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) 
                                        AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 THEN COALESCE(kv.net_value, kv.android_value + kv.ios_value) END) as last_week
      FROM kpis k
      JOIN kpi_values kv ON k.id = kv.kpi_id
      WHERE k.is_active = 1
      GROUP BY k.id, k.name, k.unit
      HAVING this_week IS NOT NULL AND last_week IS NOT NULL
    `;

    const [rows] = await pool.execute(query);
    
    const comparison = rows.map(row => ({
      ...row,
      change_percent: row.last_week ? ((row.this_week - row.last_week) / row.last_week * 100) : 0
    }));
    
    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error fetching weekly comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly comparison',
      error: error.message
    });
  }
};

const getCategories = async (req, res) => {
  try {
    console.log('📥 GET /api/kpis/categories - Fetching categories');
    
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.display_order as category_order,
        c.created_at as category_created_at,
        k.id as kpi_id,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.data_type,
        k.benchmark_value,
        k.has_platform_split,
        k.display_order as kpi_order
      FROM categories c
      LEFT JOIN kpis k ON c.id = k.category_id AND k.is_active = 1
      ORDER BY c.display_order, k.display_order
    `;

    const [rows] = await pool.execute(query);
    
    // Group KPIs by categories
    const categorizedData = {};
    
    rows.forEach(row => {
      if (!categorizedData[row.category_id]) {
        categorizedData[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          display_order: row.category_order,
          created_at: row.category_created_at,
          kpis: []
        };
      }
      
      if (row.kpi_id) {
        categorizedData[row.category_id].kpis.push({
          id: row.kpi_id,
          name: row.kpi_name,
          code: row.kpi_code,
          unit: row.unit,
          data_type: row.data_type,
          benchmark_value: row.benchmark_value,
          has_platform_split: row.has_platform_split,
          display_order: row.kpi_order,
          category_id: row.category_id
        });
      }
    });
    
    console.log(`✅ Found ${Object.keys(categorizedData).length} categories`);
    
    res.json({
      success: true,
      data: Object.values(categorizedData)
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};


const addKPIValues = async (req, res) => {
  try {
    const { kpi_id, date_value, android_value, ios_value, net_value, data_source, notes } = req.body;

    if (!kpi_id || !date_value) {
      return res.status(400).json({
        success: false,
        message: 'kpi_id and date_value are required'
      });
    }

    const query = `
      INSERT INTO kpi_values 
      (kpi_id, date_value, android_value, ios_value, net_value, data_source, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      android_value = VALUES(android_value),
      ios_value = VALUES(ios_value),
      net_value = VALUES(net_value),
      data_source = VALUES(data_source),
      notes = VALUES(notes),
      updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await pool.execute(query, [
      kpi_id, date_value, android_value, ios_value, net_value, data_source, notes
    ]);
    
    res.json({
      success: true,
      message: 'KPI values added successfully',
      insertId: result.insertId
    });

  } catch (error) {
    console.error('Error adding KPI values:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding KPI values',
      error: error.message
    });
  }
};

const getHealthCheck = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as healthy');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: rows[0].healthy ? 'connected' : 'disconnected'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
};

const getKPIDataList = async (req, res) => {
  try {
    console.log('📥 GET /api/kpis/data - Fetching KPI data list');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 20, 
      offset = 0,
      startDate, 
      endDate,
      kpiId,
      categoryId
    } = req.query;

    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, startDate, endDate, kpiId, categoryId });

    // Base query using actual table names and columns
    let query = `
      SELECT 
        kv.id,
        kv.kpi_id,
        kv.date_value,
        kv.android_value,
        kv.ios_value,
        kv.net_value,
        kv.data_source,
        kv.notes,
        kv.created_at,
        kv.updated_at,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.has_platform_split,
        c.name as category_name
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
      WHERE 1=1
    `;

    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (
        k.name LIKE ? OR 
        k.code LIKE ? OR 
        c.name LIKE ? OR
        kv.data_source LIKE ? OR
        kv.notes LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add date range filters
    if (startDate && startDate !== '') {
      query += ` AND kv.date_value >= ?`;
      params.push(startDate);
    }
    
    if (endDate && endDate !== '') {
      query += ` AND kv.date_value <= ?`;
      params.push(endDate);
    }
    
    // Add KPI filter
    if (kpiId && kpiId !== '') {
      query += ` AND kv.kpi_id = ?`;
      params.push(parseInt(kpiId));
    }
    
    // Add category filter
    if (categoryId && categoryId !== '') {
      query += ` AND k.category_id = ?`;
      params.push(parseInt(categoryId));
    }

    // Add ordering and pagination using the same format as settlements
    query += ` ORDER BY kv.date_value DESC, kv.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);

    // Execute the main query
    const [dataRows] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search && search.trim()) {
      countQuery += ` AND (
        k.name LIKE ? OR 
        k.code LIKE ? OR 
        c.name LIKE ? OR
        kv.data_source LIKE ? OR
        kv.notes LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (startDate && startDate !== '') {
      countQuery += ` AND kv.date_value >= ?`;
      countParams.push(startDate);
    }
    
    if (endDate && endDate !== '') {
      countQuery += ` AND kv.date_value <= ?`;
      countParams.push(endDate);
    }
    
    if (kpiId && kpiId !== '') {
      countQuery += ` AND kv.kpi_id = ?`;
      countParams.push(parseInt(kpiId));
    }
    
    if (categoryId && categoryId !== '') {
      countQuery += ` AND k.category_id = ?`;
      countParams.push(parseInt(categoryId));
    }

    const [countRows] = await pool.execute(countQuery, countParams);
    const total = countRows[0].total;

    console.log(`✅ Found ${dataRows.length} KPI data records out of ${total} total`);

    res.json({
      success: true,
      data: dataRows,
      pagination: {
        total: total,
        totalPages: Math.ceil(total / limitInt),
        currentPage: Math.floor(offsetInt / limitInt) + 1,
        itemsPerPage: limitInt
      },
      filters: {
        search,
        startDate,
        endDate,
        kpiId,
        categoryId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching KPI data list:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI data list',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
};

const updateKPIData = async (req, res) => {
  try {
    const { id } = req.params;
    const { android_value, ios_value, net_value, data_source, notes } = req.body;

    const query = `
      UPDATE kpi_values 
      SET 
        android_value = ?,
        ios_value = ?,
        net_value = ?,
        data_source = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      android_value || null, 
      ios_value || null, 
      net_value || null, 
      data_source || null, 
      notes || null, 
      parseInt(id)
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI data not found'
      });
    }

    res.json({
      success: true,
      message: 'KPI data updated successfully'
    });

  } catch (error) {
    console.error('Error updating KPI data:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KPI data',
      error: error.message
    });
  }
};

const deleteKPIData = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM kpi_values WHERE id = ?';
    const [result] = await pool.execute(query, [parseInt(id)]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI data not found'
      });
    }

    res.json({
      success: true,
      message: 'KPI data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting KPI data:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting KPI data',
      error: error.message
    });
  }
};

const getKPIDataById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        kv.*,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.has_platform_split,
        c.name as category_name
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
      WHERE kv.id = ?
    `;

    const [rows] = await pool.execute(query, [parseInt(id)]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI data not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error fetching KPI data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI data',
      error: error.message
    });
  }
};

const getKPIDataListSimple = async (req, res) => {
  try {
    console.log('📥 GET /api/kpis/data/simple - Fetching KPI data list (simple)');
    console.log('Query params:', req.query);
    
    const { 
      limit = 20, 
      offset = 0
    } = req.query;

    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offsetInt = Math.max(0, parseInt(offset) || 0);

    console.log('Parsed params:', { limitInt, offsetInt });

    // Simple query without complex filtering first
    let query = `
      SELECT 
        kv.id,
        kv.kpi_id,
        kv.date_value,
        kv.android_value,
        kv.ios_value,
        kv.net_value,
        kv.data_source,
        kv.notes,
        kv.created_at,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        c.name as category_name
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
      ORDER BY kv.date_value DESC, kv.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
    `;

    console.log('Final query:', query);

    const [dataRows] = await pool.execute(query);
    const [countRows] = await pool.execute(countQuery);
    
    const total = countRows[0].total;

    console.log(`✅ Found ${dataRows.length} KPI data records out of ${total} total`);

    res.json({
      success: true,
      data: dataRows,
      pagination: {
        total: total,
        totalPages: Math.ceil(total / limitInt),
        currentPage: Math.floor(offsetInt / limitInt) + 1,
        itemsPerPage: limitInt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching KPI data list:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI data list',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
};


// const getCategories = async (req, res) => {
//   try {
//     console.log('📥 GET /api/kpis/categories - Fetching categories');
    
//     const query = `
//       SELECT 
//         c.id as category_id,
//         c.name as category_name,
//         c.display_order as category_order,
//         c.created_at as category_created_at,
//         k.id as kpi_id,
//         k.name as kpi_name,
//         k.code as kpi_code,
//         k.unit,
//         k.data_type,
//         k.benchmark_value,
//         k.has_platform_split,
//         k.display_order as kpi_order
//       FROM categories c
//       LEFT JOIN kpis k ON c.id = k.category_id AND k.is_active = 1
//       ORDER BY c.display_order, k.display_order
//     `;

//     const [rows] = await pool.execute(query);
    
//     // Group KPIs by categories
//     const categorizedData = {};
    
//     rows.forEach(row => {
//       if (!categorizedData[row.category_id]) {
//         categorizedData[row.category_id] = {
//           id: row.category_id,
//           name: row.category_name,
//           display_order: row.category_order,
//           created_at: row.category_created_at,
//           kpis: []
//         };
//       }
      
//       if (row.kpi_id) {
//         categorizedData[row.category_id].kpis.push({
//           id: row.kpi_id,
//           name: row.kpi_name,
//           code: row.kpi_code,
//           unit: row.unit,
//           data_type: row.data_type,
//           benchmark_value: row.benchmark_value,
//           has_platform_split: row.has_platform_split,
//           display_order: row.kpi_order,
//           category_id: row.category_id
//         });
//       }
//     });
    
//     console.log(`✅ Found ${Object.keys(categorizedData).length} categories`);
    
//     res.json({
//       success: true,
//       data: Object.values(categorizedData)
//     });

//   } catch (error) {
//     console.error('❌ Error fetching categories:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching categories',
//       error: error.message
//     });
//   }
// };

// POST /api/kpis/categories - Create new category
const createCategory = async (req, res) => {
  try {
    console.log('📥 POST /api/kpis/categories - Creating category');
    console.log('Request body:', req.body);
    
    const { name, display_order } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category name already exists
    const checkQuery = 'SELECT id FROM categories WHERE name = ?';
    const [existingRows] = await pool.execute(checkQuery, [name.trim()]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const query = `
      INSERT INTO categories (name, display_order, created_at)
      VALUES (?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      display_order ? parseInt(display_order) : null
    ]);
    
    console.log('✅ Category created with ID:', result.insertId);
    
    res.json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertId,
        name: name.trim(),
        display_order: display_order ? parseInt(display_order) : null
      }
    });

  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// PUT /api/kpis/categories/:id - Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order } = req.body;
    
    console.log('📥 PUT /api/kpis/categories/:id - Updating category');
    console.log('Category ID:', id);
    console.log('Request body:', req.body);

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category exists
    const checkQuery = 'SELECT id FROM categories WHERE id = ?';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category name already exists (excluding current category)
    const duplicateQuery = 'SELECT id FROM categories WHERE name = ? AND id != ?';
    const [duplicateRows] = await pool.execute(duplicateQuery, [name.trim(), parseInt(id)]);
    
    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const query = `
      UPDATE categories 
      SET name = ?, display_order = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      display_order ? parseInt(display_order) : null,
      parseInt(id)
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ Category updated successfully');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: parseInt(id),
        name: name.trim(),
        display_order: display_order ? parseInt(display_order) : null
      }
    });

  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// DELETE /api/kpis/categories/:id - Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 DELETE /api/kpis/categories/:id - Deleting category');
    console.log('Category ID:', id);

    // Check if category exists
    const checkQuery = 'SELECT id, name FROM categories WHERE id = ?';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has associated KPIs
    const kpiCheckQuery = 'SELECT COUNT(*) as kpi_count FROM kpis WHERE category_id = ?';
    const [kpiRows] = await pool.execute(kpiCheckQuery, [parseInt(id)]);
    
    if (kpiRows[0].kpi_count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${kpiRows[0].kpi_count} associated KPI(s). Please move or delete the KPIs first.`
      });
    }

    const deleteQuery = 'DELETE FROM categories WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [parseInt(id)]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('✅ Category deleted successfully');

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

const getKPIs = async (req, res) => {
  try {
    console.log('📥 GET /api/kpis - Fetching KPIs');
    
    const query = `
      SELECT 
        k.id,
        k.name,
        k.code,
        k.category_id,
        k.unit,
        k.data_type,
        k.benchmark_value,
        k.has_platform_split,
        k.description,
        k.is_active,
        k.display_order,
        k.created_at,
        c.name as category_name
      FROM kpis k
      LEFT JOIN categories c ON k.category_id = c.id
      WHERE k.is_active = 1
      ORDER BY k.display_order, k.name
    `;

    const [rows] = await pool.execute(query);
    
    console.log(`✅ Found ${rows.length} KPIs`);
    
    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPIs',
      error: error.message
    });
  }
};

// POST /api/kpis - Create new KPI
const createKPI = async (req, res) => {
  try {
    console.log('📥 POST /api/kpis - Creating KPI');
    console.log('Request body:', req.body);
    
    const { 
      name, 
      code, 
      category_id, 
      unit, 
      data_type, 
      benchmark_value, 
      has_platform_split, 
      description, 
      display_order 
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'KPI name is required'
      });
    }

    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'KPI code is required'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Check if KPI code already exists
    const checkQuery = 'SELECT id FROM kpis WHERE code = ? AND is_active = 1';
    const [existingRows] = await pool.execute(checkQuery, [code.trim()]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'KPI with this code already exists'
      });
    }

    // Check if category exists
    const categoryCheckQuery = 'SELECT id FROM categories WHERE id = ?';
    const [categoryRows] = await pool.execute(categoryCheckQuery, [parseInt(category_id)]);
    
    if (categoryRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }

    const query = `
      INSERT INTO kpis 
      (name, code, category_id, unit, data_type, benchmark_value, has_platform_split, description, display_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      code.trim(),
      parseInt(category_id),
      unit || null,
      data_type || 'numeric',
      benchmark_value ? parseFloat(benchmark_value) : null,
      has_platform_split ? 1 : 0,
      description?.trim() || null,
      display_order ? parseInt(display_order) : null
    ]);
    
    console.log('✅ KPI created with ID:', result.insertId);
    
    res.json({
      success: true,
      message: 'KPI created successfully',
      data: {
        id: result.insertId,
        name: name.trim(),
        code: code.trim(),
        category_id: parseInt(category_id)
      }
    });

  } catch (error) {
    console.error('❌ Error creating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating KPI',
      error: error.message
    });
  }
};

// PUT /api/kpis/:id - Update KPI
const updateKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      category_id, 
      unit, 
      data_type, 
      benchmark_value, 
      has_platform_split, 
      description, 
      display_order 
    } = req.body;
    
    console.log('📥 PUT /api/kpis/:id - Updating KPI');
    console.log('KPI ID:', id);
    console.log('Request body:', req.body);

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'KPI name is required'
      });
    }

    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'KPI code is required'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Check if KPI exists
    const checkQuery = 'SELECT id FROM kpis WHERE id = ? AND is_active = 1';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    // Check if KPI code already exists (excluding current KPI)
    const duplicateQuery = 'SELECT id FROM kpis WHERE code = ? AND id != ? AND is_active = 1';
    const [duplicateRows] = await pool.execute(duplicateQuery, [code.trim(), parseInt(id)]);
    
    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'KPI with this code already exists'
      });
    }

    // Check if category exists
    const categoryCheckQuery = 'SELECT id FROM categories WHERE id = ?';
    const [categoryRows] = await pool.execute(categoryCheckQuery, [parseInt(category_id)]);
    
    if (categoryRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }

    const query = `
      UPDATE kpis 
      SET name = ?, code = ?, category_id = ?, unit = ?, data_type = ?, 
          benchmark_value = ?, has_platform_split = ?, description = ?, display_order = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      code.trim(),
      parseInt(category_id),
      unit || null,
      data_type || 'numeric',
      benchmark_value ? parseFloat(benchmark_value) : null,
      has_platform_split ? 1 : 0,
      description?.trim() || null,
      display_order ? parseInt(display_order) : null,
      parseInt(id)
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    console.log('✅ KPI updated successfully');

    res.json({
      success: true,
      message: 'KPI updated successfully',
      data: {
        id: parseInt(id),
        name: name.trim(),
        code: code.trim(),
        category_id: parseInt(category_id)
      }
    });

  } catch (error) {
    console.error('❌ Error updating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KPI',
      error: error.message
    });
  }
};

// DELETE /api/kpis/:id - Delete KPI (soft delete)
const deleteKPI = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 DELETE /api/kpis/:id - Deleting KPI');
    console.log('KPI ID:', id);

    // Check if KPI exists
    const checkQuery = 'SELECT id, name FROM kpis WHERE id = ? AND is_active = 1';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    // Check if KPI has associated data
    const dataCheckQuery = 'SELECT COUNT(*) as data_count FROM kpi_values WHERE kpi_id = ?';
    const [dataRows] = await pool.execute(dataCheckQuery, [parseInt(id)]);
    
    if (dataRows[0].data_count > 0) {
      // Soft delete - set is_active to 0
      const softDeleteQuery = 'UPDATE kpis SET is_active = 0 WHERE id = ?';
      await pool.execute(softDeleteQuery, [parseInt(id)]);
      
      console.log('✅ KPI soft deleted successfully (has data)');
      
      return res.json({
        success: true,
        message: 'KPI archived successfully (has associated data)'
      });
    } else {
      // Hard delete - actually remove the record
      const hardDeleteQuery = 'DELETE FROM kpis WHERE id = ?';
      const [result] = await pool.execute(hardDeleteQuery, [parseInt(id)]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      console.log('✅ KPI hard deleted successfully (no data)');

      res.json({
        success: true,
        message: 'KPI deleted successfully'
      });
    }

  } catch (error) {
    console.error('❌ Error deleting KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting KPI',
      error: error.message
    });
  }
};


// GET /api/kpis/values/:id - Get specific KPI value by ID
const getKPIValueById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 GET /api/kpis/values/:id - Fetching KPI value');
    console.log('Value ID:', id);

    const query = `
      SELECT 
        kv.*,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.has_platform_split,
        c.name as category_name,
        c.id as category_id
      FROM kpi_values kv
      JOIN kpis k ON kv.kpi_id = k.id
      JOIN categories c ON k.category_id = c.id
      WHERE kv.id = ?
    `;

    const [rows] = await pool.execute(query, [parseInt(id)]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI value not found'
      });
    }

    console.log('✅ KPI value found');

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching KPI value:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI value',
      error: error.message
    });
  }
};

// POST /api/kpis/values - Create new KPI value
const createKPIValue = async (req, res) => {
  try {
    console.log('📥 POST /api/kpis/values - Creating KPI value');
    console.log('Request body:', req.body);
    
    const { 
      kpi_id, 
      date_value, 
      android_value, 
      ios_value, 
      net_value, 
      data_source, 
      notes 
    } = req.body;

    if (!kpi_id) {
      return res.status(400).json({
        success: false,
        message: 'KPI is required'
      });
    }

    if (!date_value) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if KPI exists
    const kpiCheckQuery = 'SELECT id, name FROM kpis WHERE id = ? AND is_active = 1';
    const [kpiRows] = await pool.execute(kpiCheckQuery, [parseInt(kpi_id)]);
    
    if (kpiRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI selected'
      });
    }

    // Check if entry already exists for this KPI and date
    const duplicateQuery = 'SELECT id FROM kpi_values WHERE kpi_id = ? AND date_value = ?';
    const [duplicateRows] = await pool.execute(duplicateQuery, [parseInt(kpi_id), date_value]);
    
    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'KPI value for this date already exists. Use update instead.'
      });
    }

    const query = `
      INSERT INTO kpi_values 
      (kpi_id, date_value, android_value, ios_value, net_value, data_source, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(query, [
      parseInt(kpi_id),
      date_value,
      android_value ? parseFloat(android_value) : null,
      ios_value ? parseFloat(ios_value) : null,
      net_value ? parseFloat(net_value) : null,
      data_source?.trim() || null,
      notes?.trim() || null
    ]);
    
    console.log('✅ KPI value created with ID:', result.insertId);
    
    res.json({
      success: true,
      message: 'KPI value created successfully',
      data: {
        id: result.insertId,
        kpi_id: parseInt(kpi_id),
        date_value: date_value
      }
    });

  } catch (error) {
    console.error('❌ Error creating KPI value:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating KPI value',
      error: error.message
    });
  }
};

// PUT /api/kpis/values/:id - Update KPI value
const updateKPIValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      kpi_id, 
      date_value, 
      android_value, 
      ios_value, 
      net_value, 
      data_source, 
      notes 
    } = req.body;
    
    console.log('📥 PUT /api/kpis/values/:id - Updating KPI value');
    console.log('Value ID:', id);
    console.log('Request body:', req.body);

    if (!kpi_id) {
      return res.status(400).json({
        success: false,
        message: 'KPI is required'
      });
    }

    if (!date_value) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if KPI value exists
    const checkQuery = 'SELECT id FROM kpi_values WHERE id = ?';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI value not found'
      });
    }

    // Check if KPI exists
    const kpiCheckQuery = 'SELECT id, name FROM kpis WHERE id = ? AND is_active = 1';
    const [kpiRows] = await pool.execute(kpiCheckQuery, [parseInt(kpi_id)]);
    
    if (kpiRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI selected'
      });
    }

    // Check if another entry exists for this KPI and date (excluding current record)
    const duplicateQuery = 'SELECT id FROM kpi_values WHERE kpi_id = ? AND date_value = ? AND id != ?';
    const [duplicateRows] = await pool.execute(duplicateQuery, [parseInt(kpi_id), date_value, parseInt(id)]);
    
    if (duplicateRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Another KPI value for this date already exists'
      });
    }

    const query = `
      UPDATE kpi_values 
      SET kpi_id = ?, date_value = ?, android_value = ?, ios_value = ?, 
          net_value = ?, data_source = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(query, [
      parseInt(kpi_id),
      date_value,
      android_value ? parseFloat(android_value) : null,
      ios_value ? parseFloat(ios_value) : null,
      net_value ? parseFloat(net_value) : null,
      data_source?.trim() || null,
      notes?.trim() || null,
      parseInt(id)
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI value not found'
      });
    }

    console.log('✅ KPI value updated successfully');

    res.json({
      success: true,
      message: 'KPI value updated successfully',
      data: {
        id: parseInt(id),
        kpi_id: parseInt(kpi_id),
        date_value: date_value
      }
    });

  } catch (error) {
    console.error('❌ Error updating KPI value:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating KPI value',
      error: error.message
    });
  }
};

// DELETE /api/kpis/values/:id - Delete KPI value
const deleteKPIValue = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📥 DELETE /api/kpis/values/:id - Deleting KPI value');
    console.log('Value ID:', id);

    // Check if KPI value exists
    const checkQuery = 'SELECT id FROM kpi_values WHERE id = ?';
    const [existingRows] = await pool.execute(checkQuery, [parseInt(id)]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI value not found'
      });
    }

    const deleteQuery = 'DELETE FROM kpi_values WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [parseInt(id)]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'KPI value not found'
      });
    }

    console.log('✅ KPI value deleted successfully');

    res.json({
      success: true,
      message: 'KPI value deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting KPI value:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting KPI value',
      error: error.message
    });
  }
};


const getKPIComparison = async (req, res) => {
  try {
    const { 
      startDate1, 
      endDate1, 
      startDate2, 
      endDate2, 
      kpiId,
      categoryId 
    } = req.query;

    console.log('📊 KPI Comparison request:', {
      period1: `${startDate1} to ${endDate1}`,
      period2: `${startDate2} to ${endDate2}`,
      kpiId,
      categoryId
    });

    // Validate required parameters
    if (!startDate1 || !endDate1 || !startDate2 || !endDate2) {
      return res.status(400).json({
        success: false,
        message: 'All date range parameters are required'
      });
    }

    // Build base query
    let query = `
      SELECT 
        k.id as kpi_id,
        k.name as kpi_name,
        k.code as kpi_code,
        k.unit,
        k.benchmark_value,
        k.has_platform_split,
        c.id as category_id,
        c.name as category_name,
        
        -- Period 1 averages
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.android_value END), 2) as period1_android_avg,
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.ios_value END), 2) as period1_ios_avg,
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.net_value END), 2) as period1_net_avg,
        
        -- Period 2 averages
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.android_value END), 2) as period2_android_avg,
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.ios_value END), 2) as period2_ios_avg,
        ROUND(AVG(CASE WHEN kv.date_value BETWEEN ? AND ? 
                       THEN kv.net_value END), 2) as period2_net_avg,
        
        -- Data point counts for validation
        COUNT(CASE WHEN kv.date_value BETWEEN ? AND ? THEN 1 END) as period1_count,
        COUNT(CASE WHEN kv.date_value BETWEEN ? AND ? THEN 1 END) as period2_count
        
      FROM kpis k
      LEFT JOIN categories c ON k.category_id = c.id
      LEFT JOIN kpi_values kv ON k.id = kv.kpi_id
      WHERE k.is_active = 1
    `;

    const params = [
      startDate1, endDate1,  // Period 1 android
      startDate1, endDate1,  // Period 1 ios
      startDate1, endDate1,  // Period 1 net
      startDate2, endDate2,  // Period 2 android
      startDate2, endDate2,  // Period 2 ios
      startDate2, endDate2,  // Period 2 net
      startDate1, endDate1,  // Period 1 count
      startDate2, endDate2   // Period 2 count
    ];

    // Add optional filters
    if (kpiId) {
      query += ` AND k.id = ?`;
      params.push(parseInt(kpiId));
    }

    if (categoryId) {
      query += ` AND k.category_id = ?`;
      params.push(parseInt(categoryId));
    }

    query += `
      GROUP BY k.id, k.name, k.code, k.unit, k.benchmark_value, k.has_platform_split, c.id, c.name
      HAVING (period1_count > 0 OR period2_count > 0)
      ORDER BY c.display_order, k.display_order, k.name
    `;

    console.log('📤 Executing comparison query...');
    const [rows] = await pool.execute(query, params);

    // Process results and calculate growth percentages
    const comparisonData = rows.map(row => {
      const calculateGrowth = (period1Value, period2Value) => {
        if (!period1Value || period1Value === 0) {
          return period2Value ? 100 : 0; // If starting from 0, show 100% growth if there's a value
        }
        if (!period2Value) {
          return -100; // If ending at 0, show -100% decline
        }
        return ((period2Value - period1Value) / Math.abs(period1Value)) * 100;
      };

      return {
        kpi_id: row.kpi_id,
        kpi_name: row.kpi_name,
        kpi_code: row.kpi_code,
        category_id: row.category_id,
        category_name: row.category_name,
        unit: row.unit,
        benchmark_value: row.benchmark_value,
        has_platform_split: row.has_platform_split,
        
        period1: {
          android: row.period1_android_avg,
          ios: row.period1_ios_avg,
          net: row.period1_net_avg,
          data_points: row.period1_count
        },
        
        period2: {
          android: row.period2_android_avg,
          ios: row.period2_ios_avg,
          net: row.period2_net_avg,
          data_points: row.period2_count
        },
        
        growth: {
          android: row.period1_android_avg && row.period2_android_avg ? 
            calculateGrowth(row.period1_android_avg, row.period2_android_avg) : null,
          ios: row.period1_ios_avg && row.period2_ios_avg ? 
            calculateGrowth(row.period1_ios_avg, row.period2_ios_avg) : null,
          net: row.period1_net_avg && row.period2_net_avg ? 
            calculateGrowth(row.period1_net_avg, row.period2_net_avg) : null
        }
      };
    });

    // Group by categories
    const categorizedData = {};
    comparisonData.forEach(item => {
      if (!categorizedData[item.category_id]) {
        categorizedData[item.category_id] = {
          id: item.category_id,
          name: item.category_name,
          kpis: []
        };
      }
      categorizedData[item.category_id].kpis.push(item);
    });

    console.log(`✅ Comparison data processed: ${comparisonData.length} KPIs across ${Object.keys(categorizedData).length} categories`);

    res.json({
      success: true,
      data: {
        categories: Object.values(categorizedData),
        summary: {
          total_kpis: comparisonData.length,
          total_categories: Object.keys(categorizedData).length,
          period1: { startDate: startDate1, endDate: endDate1 },
          period2: { startDate: startDate2, endDate: endDate2 }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching KPI comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPI comparison data',
      error: error.message
    });
  }
};


const bulkInsertKPIValues = async (req, res) => {
  try {
    console.log('📥 POST /api/kpis/values/bulk - Bulk inserting KPI values');
    console.log('Request body:', req.body);
    
    const { kpi_id, values } = req.body;

    if (!kpi_id) {
      return res.status(400).json({
        success: false,
        message: 'KPI ID is required'
      });
    }

    if (!values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Values array is required and must not be empty'
      });
    }

    // Check if KPI exists
    const kpiCheckQuery = 'SELECT id, name FROM kpis WHERE id = ? AND is_active = 1';
    const [kpiRows] = await pool.execute(kpiCheckQuery, [parseInt(kpi_id)]);
    
    if (kpiRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI selected'
      });
    }

    // Validate each value in the array
    const validatedValues = [];
    const errors = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const rowErrors = [];

      // Check required fields
      if (!value.date_value) {
        rowErrors.push('date_value is required');
      }

      // Check that at least one value is provided
      if (!value.android_value && !value.ios_value && !value.net_value) {
        rowErrors.push('At least one value (android_value, ios_value, net_value) is required');
      }

      // Validate date format
      if (value.date_value) {
        const date = new Date(value.date_value);
        if (isNaN(date.getTime())) {
          rowErrors.push('Invalid date format');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: i + 1,
          errors: rowErrors
        });
      } else {
        validatedValues.push({
          kpi_id: parseInt(kpi_id),
          date_value: value.date_value,
          android_value: value.android_value ? parseFloat(value.android_value) : null,
          ios_value: value.ios_value ? parseFloat(value.ios_value) : null,
          net_value: value.net_value ? parseFloat(value.net_value) : null,
          data_source: value.data_source?.trim() || 'Import',
          notes: value.notes?.trim() || null
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors: errors
      });
    }

    // Use transaction for bulk insert
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let successCount = 0;
      let skipCount = 0;
      const conflictRows = [];

      for (const valueData of validatedValues) {
        try {
          // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert behavior
          const query = `
            INSERT INTO kpi_values 
            (kpi_id, date_value, android_value, ios_value, net_value, data_source, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
            android_value = VALUES(android_value),
            ios_value = VALUES(ios_value),
            net_value = VALUES(net_value),
            data_source = VALUES(data_source),
            notes = VALUES(notes),
            updated_at = NOW()
          `;

          const [result] = await connection.execute(query, [
            valueData.kpi_id,
            valueData.date_value,
            valueData.android_value,
            valueData.ios_value,
            valueData.net_value,
            valueData.data_source,
            valueData.notes
          ]);

          if (result.insertId > 0) {
            successCount++;
          } else {
            // This was an update (duplicate key)
            conflictRows.push(valueData.date_value);
            successCount++; // Still count as successful
          }

        } catch (insertError) {
          console.error('Error inserting row:', insertError);
          skipCount++;
        }
      }

      await connection.commit();
      
      console.log(`✅ Bulk insert completed: ${successCount} successful, ${skipCount} skipped`);

      let message = `Successfully imported ${successCount} records`;
      if (conflictRows.length > 0) {
        message += ` (${conflictRows.length} existing records were updated)`;
      }
      if (skipCount > 0) {
        message += ` (${skipCount} records skipped due to errors)`;
      }

      res.json({
        success: true,
        message: message,
        summary: {
          total_processed: validatedValues.length,
          successful: successCount,
          skipped: skipCount,
          updated_existing: conflictRows.length,
          conflict_dates: conflictRows
        }
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error in bulk insert:', error);
    res.status(500).json({
      success: false,
      message: 'Error during bulk import',
      error: error.message
    });
  }
};



// Export all methods
module.exports = {
  getDashboardData,
  getAvailableDateRange,
  getLatestKPIs,
  getKPITrend,
  getWeeklyComparison,
  getCategories,
  addKPIValues,
  getHealthCheck,
  getKPIDataList,
  getKPIDataListSimple,
  updateKPIData,
  deleteKPIData,
  getKPIDataById,

  createCategory,
  updateCategory,
  deleteCategory,

  getKPIs,
  createKPI,
  updateKPI,
  deleteKPI,

   getKPIValueById,
  createKPIValue,
  updateKPIValue,
  deleteKPIValue,
  
getKPIComparison,
bulkInsertKPIValues,

};