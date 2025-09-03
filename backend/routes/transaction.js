const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,getTransactionSegmentAnalysis
} = require('../controllers/transactionController');

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', getTransactionStats);

// GET /api/transactions - Get all transactions with filters and pagination
router.get('/', getTransactions);

// GET /api/transactions/:id - Get single transaction by ID
router.get('/:id', getTransactionById);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

router.get('/:id/segments', getTransactionSegmentAnalysis);

module.exports = router;