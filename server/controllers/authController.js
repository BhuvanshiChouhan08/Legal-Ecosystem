const User = require('../models/userModels');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');

  
exports.register = async (req, res) => {
    try {
      const { fullName, email, phone, address, password, confirmPassword, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }
  
      // Create user
      const user = new User({
        fullName,
        email,
        phone,
        address,
        password,
        role
      });
  
      await user.save();

         // Send welcome email
        await transporter.sendMail({
            to: email,
            subject: 'Welcome to Legal System',
            text: `Hi ${fullName}, welcome to our platform!`
        });
  
      // Respond with success
      res.status(201).json({ message: "User registered successfully", user: { fullName, email, role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials or role' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
