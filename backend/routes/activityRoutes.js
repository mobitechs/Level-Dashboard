const express = require('express');
const router = express.Router();
const {
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivityStats,
  getActivityTypes,
  getActivityCategories,
  getAvailableDateRange
} = require('../controllers/activityController');

// GET /api/activities/stats - Get activity statistics
router.get('/stats', getActivityStats);

// GET /api/activities/types - Get all activity types for filters
router.get('/types', getActivityTypes);

// GET /api/activities/categories - Get all activity categories for filters
router.get('/categories', getActivityCategories);

// GET /api/activities - Get all activities with filters and pagination
router.get('/', getActivities);

// GET /api/activities/:id - Get single activity by ID
router.get('/:id', getActivityById);

// PUT /api/activities/:id - Update activity
router.put('/:id', updateActivity);

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', deleteActivity);

router.get('/date-range', getAvailableDateRange);

module.exports = router;