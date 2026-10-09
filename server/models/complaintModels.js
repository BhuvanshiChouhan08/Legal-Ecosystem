const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
    caseType: String,
    description: String,
    date: String,
    area: String,
    priority: String
  });

module.exports = mongoose.model('Complaint', complaintSchema);