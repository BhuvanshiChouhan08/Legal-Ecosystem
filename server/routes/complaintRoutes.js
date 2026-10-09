const express = require('express');
const router = express.Router();
const { submit } = require('../controllers/complaintController')
const { predictPrioritySignal } = require('../ml/priorityInference')

router.post('/complaints', submit);
router.post('/priority-prediction', (req, res) => {
  try {
    res.json(predictPrioritySignal(req.body.caseType));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Prediction failed' });
  }
});

module.exports = router;
