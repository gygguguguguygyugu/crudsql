const express = require('express');//Express application to handle web requests easily.
const bodyParser = require('body-parser');//body-parser is a middleware for Node.js that parses incoming request bodies in a middleware
const mysql = require('mysql');//connection with MySQL database for executing queries.
const multer = require('multer');//Handles file /images uploads and manages storage configuration in Node.js.
const path = require('path');//images path
const fs = require('fs');//Provides file system operations like reading and writing files.

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads' folder

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it does not exist
    }
    cb(null, uploadPath); // Save files in 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage: storage });

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dbcrud'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
  console.log('Connected to DB');
});

// POST (Add) a product
app.post('/api/product/add', upload.single('image'), (req, res) => {
  const { name, price, quantity,image } = req.body;
  

  const details = {
    name,
    price,
    quantity,
    image // Save the image path in the database
  };

  const sql = 'INSERT INTO product SET ?';

  db.query(sql, details, (error) => {
    if (error) {
      res.status(500).send({ status: false, message: 'Product creation failed' });
    } else {
      res.send({ status: true, message: 'Product created successfully' });
    }
  });
});

// GET all products
app.get('/api/product', (req, res) => {
  const sql = 'SELECT * FROM product';

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error retrieving products:', error);
      res.status(500).send({ status: false, message: 'Failed to retrieve products' });
    } else {
      res.send({ status: true, data: results });
    }
  });
});

// GET a product by ID
app.get('/api/product/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM product WHERE id = ?';

  db.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Error retrieving product:', error);
      res.status(500).send({ status: false, message: 'Failed to retrieve product' });
    } else {
      if (results.length > 0) {
        res.send({ status: true, data: results[0] });
      } else {
        res.status(404).send({ status: false, message: 'Product not found' });
      }
    }
  });
});

// PUT (Update) a product by ID
app.put('/api/product/update/:id', upload.single('image'), (req, res) => {
  const productId = req.params.id;
  const { name, price, quantity ,image} = req.body;
  

  // Construct the SQL update query
  const sql = 'UPDATE product SET name = ?, price = ?, quantity = ?, image = ? WHERE id = ?';
  const values = [name, price, quantity, image, productId];

  db.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error updating product:', error);
      res.status(500).send({ status: false, message: 'Failed to update product' });
    } else {
      if (results.affectedRows > 0) {
        res.send({ status: true, message: 'Product updated successfully' });
      } else {
        res.status(404).send({ status: false, message: 'Product not found' });
      }
    }
  });
});


// DELETE a product by ID
app.delete('/api/product/delete/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'DELETE FROM product WHERE id = ?';

  db.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Error deleting product:', error);
      res.status(500).send({ status: false, message: 'Failed to delete product' });
    } else {
      if (results.affectedRows > 0) {
        res.send({ status: true, message: 'Product deleted successfully' });
      } else {
        res.status(404).send({ status: false, message: 'Product not found' });
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
