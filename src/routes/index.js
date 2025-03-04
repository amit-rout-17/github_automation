const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API'
  });
});

// Add more routes as needed

module.exports = router;
