require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3010;
const mongoURI = process.env.MONGO_URI;

// Ensure MongoDB URI exists before proceeding
if (!mongoURI) {
  console.error("❌ MongoDB connection string is missing! Check your .env file.");
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Define MenuItem Schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"] },
  description: { type: String },
  price: { 
    type: Number, 
    required: [true, "Price is required"], 
    min: [0, "Price must be a positive number"] 
  }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Routes

// Create a new menu item (POST)
app.post('/menu', async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Invalid or missing 'name'" });
    }
    if (price == null || typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Invalid or missing 'price'" });
    }

    const newItem = new MenuItem({ name, description, price });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create menu item", details: error.message });
  }
});

// Get all menu items (GET)
app.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu items", details: error.message });
  }
});

// Update a menu item (PUT)
app.put('/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
      return res.status(400).json({ error: "Invalid 'price' value" });
    }
    
    const updatedItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to update menu item", details: error.message });
  }
});

// Delete a menu item (DELETE)
app.delete('/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete menu item", details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});