const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client } = require('pg');
const app = express();

// Load environment variables from .env file
dotenv.config();

// Initialize PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Add your PostgreSQL connection URL here
});
client.connect()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error', err.stack));

// Enable CORS
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE'], // Allow specific HTTP methods
};
app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(express.json());

// Health check route
app.get('/api/healthz', (req, res) => {
  res.status(200).json({ message: 'I AM ALIVE!' });
});

// Create a new Todo
app.post('/api/todo', async (req, res) => {
  const { title, summary } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO todos (title, summary) VALUES ($1, $2) RETURNING id',
      [title, summary]
    );
    res.status(200).json({ message: 'Todo created successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error inserting todo:', err);
    res.status(500).json({ message: 'Failed to insert todo' });
  }
});

// Get a specific Todo by ID
app.get('/api/todo/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query(
      'SELECT title, summary FROM todos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const todo = result.rows[0];
    res.status(200).json(todo);
  } catch (err) {
    console.error('Error querying todo:', err);
    res.status(500).json({ message: 'Failed to fetch todo' });
  }
});

// Get all Todos
app.get('/api/todos', async (req, res) => {
  try {
    const result = await client.query('SELECT id, title, summary FROM todos');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// Delete a Todo by ID
app.delete('/api/todo/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const deletedTodo = result.rows[0];
    res.status(200).json(deletedTodo);
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

// Start the server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
