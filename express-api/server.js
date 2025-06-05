// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// hello world at the root
app.get('/', (req, res) => {
  res.send('Hello world.');
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


