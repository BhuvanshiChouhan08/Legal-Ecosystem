const Complaint = require('../models/complaintModels')

exports.submit = async (req, res) => {
    try {
      const complaint = new Complaint(req.body);
      await complaint.save();
      res.status(201).json({ message: 'Complaint submitted', id: complaint._id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit complaint' });
    }};