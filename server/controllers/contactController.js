const transporter = require('../config/mailer');
const contactMessage = require('../models/contactMessage')

exports.contact = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
  
    try {
      const newMessage = new contactMessage({ name, email, subject, message });
      await newMessage.save();

    // Send acknowledgment email
     await transporter.sendMail({
        to: email,
        subject: 'Thanks for contacting Legal System',
        text: `Hi ${name}, we received your message: "${message}". We'll get back soon.`
      });

      res.status(201).json({ message: 'Message received successfully! & ACK send' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error. Please try again later.' });
    }
  };
