const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getAvailableDateRange,
  getLatestKPIs,
  getKPITrend,
  getWeeklyComparison,
  getCategories,
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
  addKPIValues,
  getHealthCheck,
  getKPIDataList,
  getKPIDataListSimple,
  updateKPIData,
  deleteKPIData,
  getKPIDataById,
  getKPIComparison,
  bulkInsertKPIValues  
} = require('../controllers/kpiController');

// Dashboard routes
router.get('/dashboard', getDashboardData);
router.get('/date-range', getAvailableDateRange);
router.get('/latest', getLatestKPIs);
router.get('/trend/:kpiId', getKPITrend);
router.get('/weekly-comparison', getWeeklyComparison);

// Category management routes
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// KPI management routes
router.get('/', getKPIs);
router.post('/', createKPI);
router.put('/:id', updateKPI);
router.delete('/:id', deleteKPI);

// KPI Data CRUD routes
router.get('/data', getKPIDataList);
router.get('/data-simple', getKPIDataListSimple);
router.get('/data/:id', getKPIDataById);
router.put('/data/:id', updateKPIData);
router.delete('/data/:id', deleteKPIData);

// KPI Values routes
router.get('/values/:id', getKPIValueById);
router.post('/values', createKPIValue);
router.put('/values/:id', updateKPIValue);
router.delete('/values/:id', deleteKPIValue);

// Legacy route for backward compatibility
router.post('/add-values', addKPIValues);

router.get('/comparison', getKPIComparison);

router.post('/values/bulk', bulkInsertKPIValues);

// Health check
router.get('/health', getHealthCheck);

module.exports = router;