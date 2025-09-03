const pool = require('../config/level_database');

const getActivityStats = async (req, res) => {
  try {
    const {
      startDate = '',
      endDate = '',
      activityType = '',
      category = ''
    } = req.query;

    console.log('🔄 Getting activity statistics with date filter...');

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Build WHERE clause with date filtering
    let whereClause = 'WHERE uca.completion_date >= ? AND uca.completion_date <= ?';
    const params = [finalStartDate, finalEndDate];

    if (activityType && activityType !== '') {
      whereClause += ' AND at.name = ?';
      params.push(activityType);
    }

    if (category && category !== '') {
      whereClause += ' AND aa.category = ?';
      params.push(category);
    }

    // Get stats only for the date range - much faster
    const [overviewStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT aa.id) as total_activities,
        COUNT(uca.id) as total_plays,
        COUNT(DISTINCT uca.user_id) as unique_users
      FROM user_completed_activities uca
      JOIN app_activities aa ON uca.activity_id = aa.id
      LEFT JOIN activity_types at ON aa.activity_type = at.id
      ${whereClause}
    `, params);

    const stats = {
      overview: {
        total_activities: parseInt(overviewStats[0].total_activities || 0),
        total_plays: parseInt(overviewStats[0].total_plays || 0),
        unique_users: parseInt(overviewStats[0].unique_users || 0),
        avg_repeat_rate: 0,
        date_range: `${finalStartDate} to ${finalEndDate}`
      },
      applied_filters: { 
        startDate: finalStartDate, 
        endDate: finalEndDate,
        activityType, 
        category 
      }
    };

    console.log('✅ Activity statistics retrieved for date range');
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error in getActivityStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message
    });
  }
};

const getActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      activityType = '',
      category = '',
      startDate = '',
      endDate = '',
      sortBy = 'total_plays',
      sortOrder = 'DESC',
      minPlays = '',
      maxPlays = '',
      minUsers = '',
      maxUsers = ''
    } = req.query;

    console.log('🔄 Getting activities with date and advanced filters...');

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offsetInt = (pageInt - 1) * limitInt;

    // First get activities with play stats for the date range
    let query = `
      SELECT 
        aa.id,
        aa.name,
        aa.activity_type,
        at.name as activity_type_name,
        aa.category,
        COUNT(uca.id) as total_plays,
        COUNT(DISTINCT uca.user_id) as unique_users,
        COUNT(uca.id) - COUNT(DISTINCT uca.user_id) as repeat_plays,
        CASE 
          WHEN COUNT(uca.id) > 0 
          THEN ROUND((COUNT(uca.id) - COUNT(DISTINCT uca.user_id)) / COUNT(uca.id) * 100, 1)
          ELSE 0 
        END as repeat_rate
      FROM app_activities aa
      LEFT JOIN activity_types at ON aa.activity_type = at.id
      INNER JOIN user_completed_activities uca ON aa.id = uca.activity_id
      WHERE uca.completion_date >= ? AND uca.completion_date <= ?
    `;

    const params = [finalStartDate, finalEndDate];

    // Add filters
    if (search && search.trim()) {
      query += ` AND (aa.name LIKE ? OR at.name LIKE ? OR aa.category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (activityType && activityType !== '') {
      query += ' AND at.name = ?';
      params.push(activityType);
    }

    if (category && category !== '') {
      query += ' AND aa.category = ?';
      params.push(category);
    }

    // Group by activity
    query += ' GROUP BY aa.id, aa.name, aa.activity_type, at.name, aa.category';

    // Add advanced filters after GROUP BY
    const havingConditions = [];
    if (minPlays && minPlays !== '') {
      havingConditions.push('COUNT(uca.id) >= ?');
      params.push(parseInt(minPlays));
    }
    if (maxPlays && maxPlays !== '') {
      havingConditions.push('COUNT(uca.id) <= ?');
      params.push(parseInt(maxPlays));
    }
    if (minUsers && minUsers !== '') {
      havingConditions.push('COUNT(DISTINCT uca.user_id) >= ?');
      params.push(parseInt(minUsers));
    }
    if (maxUsers && maxUsers !== '') {
      havingConditions.push('COUNT(DISTINCT uca.user_id) <= ?');
      params.push(parseInt(maxUsers));
    }

    if (havingConditions.length > 0) {
      query += ' HAVING ' + havingConditions.join(' AND ');
    }

    // Add sorting
    const allowedSortFields = ['id', 'name', 'total_plays', 'repeat_plays', 'unique_users', 'repeat_rate', 'activity_type_name'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'total_plays';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
    query += ` LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query.substring(0, 200) + '...');
    console.log('Parameters:', params);

    const [dataRows] = await pool.execute(query, params);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(DISTINCT aa.id) as total
      FROM app_activities aa
      LEFT JOIN activity_types at ON aa.activity_type = at.id
      INNER JOIN user_completed_activities uca ON aa.id = uca.activity_id
      WHERE uca.completion_date >= ? AND uca.completion_date <= ?
    `;
    
    const countParams = [finalStartDate, finalEndDate];

    if (search && search.trim()) {
      countQuery += ` AND (aa.name LIKE ? OR at.name LIKE ? OR aa.category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (activityType && activityType !== '') {
      countQuery += ' AND at.name = ?';
      countParams.push(activityType);
    }

    if (category && category !== '') {
      countQuery += ' AND aa.category = ?';
      countParams.push(category);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Format the data
    const formattedData = dataRows.map(row => ({
      id: row.id,
      name: row.name,
      activity_type: row.activity_type,
      activity_type_name: row.activity_type_name || 'Unknown',
      category: row.category,
      total_plays: parseInt(row.total_plays || 0),
      unique_users: parseInt(row.unique_users || 0),
      repeat_plays: parseInt(row.repeat_plays || 0),
      total_users: parseInt(row.unique_users || 0),
      repeat_rate: parseFloat(row.repeat_rate || 0)
    }));

    console.log(`✅ Found ${formattedData.length} activities for date range ${finalStartDate} to ${finalEndDate}`);

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
      },
      filters_applied: {
        date_range: `${finalStartDate} to ${finalEndDate}`,
        activity_type: activityType,
        category,
        search
      }
    });

  } catch (error) {
    console.error('❌ Error in getActivities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// Get available date range for activities
const getAvailableDateRange = async (req, res) => {
  try {
    const [dateRange] = await pool.execute(`
      SELECT 
        DATE(MIN(completion_date)) as min_date,
        DATE(MAX(completion_date)) as max_date
      FROM user_completed_activities
    `);

    res.json({
      success: true,
      data: {
        min_date: dateRange[0].min_date,
        max_date: dateRange[0].max_date
      }
    });

  } catch (error) {
    console.error('❌ Error getting date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching date range',
      error: error.message
    });
  }
};

// Keep other functions simple
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT aa.id, aa.name, aa.activity_type, at.name as activity_type_name, aa.category
      FROM app_activities aa
      LEFT JOIN activity_types at ON aa.activity_type = at.id
      WHERE aa.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching activity', error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, activity_type, category } = req.body;
    
    const [result] = await pool.execute(
      `UPDATE app_activities SET name = ?, activity_type = ?, category = ? WHERE id = ?`,
      [name, activity_type, category, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    
    res.json({ success: true, message: 'Activity updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating activity', error: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM app_activities WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting activity', error: error.message });
  }
};

const getActivityTypes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT id, name FROM activity_types ORDER BY name`);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching activity types', error: error.message });
  }
};

const getActivityCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT category FROM app_activities 
      WHERE category IS NOT NULL AND category != '' 
      ORDER BY category
    `);
    
    const categories = rows.map(row => ({ id: row.category, name: row.category }));
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivityStats,
  getActivityTypes,
  getActivityCategories,
  getAvailableDateRange
};