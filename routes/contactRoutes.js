const express = require("express");
const router = express.Router();

const {
  createContact,
  getContacts,
  deleteContact
} = require("../controllers/contactController");

router.post("/contact", createContact);
router.get("/contact", getContacts);
router.delete("/contact/:id", deleteContact);

module.exports = router;