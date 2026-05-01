import express, { json } from "express";
import { connect, Schema, model } from "mongoose";
import cors from "cors";
import "dotenv/config";

const app = express();
const DB_HOST = process.env.DB_HOST;
const PORT = process.env.PORT;

app.use(cors());

connect(DB_HOST)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const todoSchema = new Schema(
  {
    title: String,
    completed: Boolean,
    order: Number,
  },
  { versionKey: false },
);

const Todo = model("Todo", todoSchema);

app.use(json());

app.get("/todos", async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ order: 1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/todos", async (req, res) => {
  const { title, completed } = req.body;

  try {
    const topTodo = await Todo.findOne().sort({ order: 1 });

    const newOrder = topTodo ? topTodo.order - 1 : 0;

    const newTodo = new Todo({ title, completed, order: newOrder });
    const savedTodo = await newTodo.save();

    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/todos/:_id", async (req, res) => {
  const { _id } = req.params;

  try {
    const deletedTodo = await Todo.findByIdAndDelete(_id);
    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(deletedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/todos/:_id", async (req, res) => {
  const { _id } = req.params;
  const { title, completed } = req.body;

  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      _id,
      { title, completed },
      { new: true },
    );
    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/save-todos", async (req, res) => {
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

app.patch("/todos/:_id/order", async (req, res) => {
  const { _id } = req.params;
  const { destinationIndex } = req.body;

  try {
    const todos = await Todo.find().sort({ order: 1 });

    const draggedIndex = todos.findIndex((todo) => todo._id.toString() === _id);

    if (draggedIndex === -1) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const [draggedTodo] = todos.splice(draggedIndex, 1);
    todos.splice(destinationIndex, 0, draggedTodo);

    const bulkOps = todos.map((todo, index) => ({
      updateOne: {
        filter: { _id: todo._id },
        update: { order: index },
      },
    }));

    await Todo.bulkWrite(bulkOps);

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
