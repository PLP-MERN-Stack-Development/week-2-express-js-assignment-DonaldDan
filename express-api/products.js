// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get a specific product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).send('Product not found');
  }
});

//Post a new product
app.post('/api/products', (req, res) => {
  const newProduct = {
    id: uuidv4(),
    ...req.body
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Update a product by ID
app.put('/api/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex !== -1) {
    const updatedProduct = {
      ...products[productIndex],
      ...req.body
    };
    products[productIndex] = updatedProduct;
    res.json(updatedProduct);
  } else {
    res.status(404).send('Product not found');
  }
});

// Delete a product by ID
app.delete('/api/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex !== -1) {
    products.splice(productIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).send('Product not found');
  }
});

// Custom middleware for request logging time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
  });
  next();
});

// Custom middleware to parse JSON bodies
app.use((req, res, next) => {
  if (req.is('application/json')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      return res.status(400).send('Invalid JSON');
    }
  }
  next();
});

// authication middleware that checks for api key in the request header
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === 'your-secret-api-key') {
    next();
  } else {
    res.status(401).send('Unauthorized: Invalid API Key');
  }
}
);


// validation middleware for product creation and update routes
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const { name, description, price, category } = req.body;
    if (!name || !description || typeof price !== 'number' || !category) {
      return res.status(400).send('Invalid product data');
    }
  }
  next();
});


// global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// create custome error classes not found error
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}
// create custom error class for validation error
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// proper error response with appropriate HTTP status codes
app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});


// handle ansychronous errors using try-catch
app.use(async (req, res, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Quary parameters for filtering products by category
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filteredProducts = products.filter(p => p.category === category);
    return res.json(filteredProducts);
  }
  res.json(products);
});

// Pagination for products
app.get('/api/products', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = products.slice(startIndex, endIndex);
  res.json({
    page: parseInt(page),
    limit: parseInt(limit),
    total: products.length,
    products: paginatedProducts
  });
});

// serach endpoint to allow searching products by name
app.get('/api/products/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).send('Query parameter "q" is required');
  }
  const searchResults = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json(searchResults);
});

// implementing routes for getting product statistics / count by category
app.get('/api/products/stats', (req, res) => {
  const stats = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  res.json(stats);
});







app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});