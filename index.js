import express, { json } from 'express';
import { connect, Schema, model } from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const DB_HOST = process.env.DB_HOST;
const PORT = process.env.PORT;

app.use(cors());

connect(DB_HOST)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const todoSchema = new Schema(
    {
  title: String,  
  completed: Boolean  
    },
    { versionKey: false }
);

const Todo = model('Todo', todoSchema);

app.use(json());

app.get('/todos', async (_req, res) => {
    try {
        const todos = await Todo.find(); 
        res.json(todos); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/todos', async (req, res) => {
    const { title, completed } = req.body;

    try {
        const newTodo = new Todo({ title, completed });
        const savedTodo = await newTodo.save(); 
        res.status(201).json(savedTodo); 
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


app.delete('/todos/:_id', async (req, res) => {
    const { _id } = req.params;

    try {
        const deletedTodo = await Todo.findByIdAndDelete(_id); 
        if (!deletedTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.json(deletedTodo); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.put('/todos/:_id', async (req, res) => {
    const { _id } = req.params;
    const { title, completed } = req.body;

    try {
        const updatedTodo = await Todo.findByIdAndUpdate(
            _id,
            { title, completed },
            { new: true }
        );
        if (!updatedTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.json(updatedTodo); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.post('/save-todos', async (req, res) => {
  const todosArray = req.body; 

  try {
    
    const todosWithOrder = todosArray.map((todo, index) => ({
      ...todo,
      order: index, 
    }));

    await Todo.deleteMany({});

    const savedTodos = await Todo.insertMany(todosWithOrder);

    res.status(201).json(savedTodos); 
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
