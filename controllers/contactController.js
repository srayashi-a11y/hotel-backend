const Contact = require("../models/Contact");

// CREATE CONTACT
exports.createContact = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    // check if email already exists
    const existing = await Contact.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "This email has already submitted the form.",
      });
    }

    const newContact = new Contact({
      name,
      phone,
      email,
      message,
    });

    await newContact.save();

    res.status(201).json({
      message: "Message submitted successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// GET ALL (optional for admin)
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contacts" });
  }
};
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};