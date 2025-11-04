/*
 * This is your backend server.
 * Save this file as 'server.js' in your 'exp8' folder.
 */
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

// Initialize express app
const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse incoming JSON bodies

// --- Database Connection ---
// Your secret connection string
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
    process.exit(1); // Stop the server if the DB string is missing
}

const client = new MongoClient(uri);
let db, customersCollection;

// Function to connect to the database
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB Atlas");
        
        // Use your database. Replace 'crm-database' if you used a different name.
        db = client.db("crm-database"); 
        
        // Use your collection. Replace 'customers' if you used a different name.
        customersCollection = db.collection("customers");
        
    } catch (e) {
        console.error("Could not connect to MongoDB Atlas", e);
        process.exit(1); // Exit if connection fails
    }
}

// --- API Endpoints ---

// GET /api/customers - Fetch all customers
app.get('/api/customers', async (req, res) => {
    if (!customersCollection) {
        return res.status(500).send({ message: "Database not initialized" });
    }
    try {
        const customers = await customersCollection.find({}).toArray();
        res.status(200).json(customers);
    } catch (e) {
        console.error("Error fetching customers:", e);
        res.status(500).send({ message: "Failed to fetch customers" });
    }
});

// POST /api/customers - Create a new customer
app.post('/api/customers', async (req, res) => {
    if (!customersCollection) {
        return res.status(500).send({ message: "Database not initialized" });
    }
    try {
        const newCustomer = req.body;
        // Add a 'createdAt' timestamp
        newCustomer.createdAt = new Date();
        
        const result = await customersCollection.insertOne(newCustomer);
        res.status(201).json(result.ops[0]); // Send back the new customer object
    } catch (e) {
        console.error("Error creating customer:", e);
        res.status(500).send({ message: "Failed to create customer" });
    }
});

// PUT /api/customers/:id - Update a customer
app.put('/api/customers/:id', async (req, res) => {
    if (!customersCollection) {
        return res.status(500).send({ message: "Database not initialized" });
    }
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Ensure 'name', 'email', 'phone' are in the update data
        const customerToUpdate = {
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone
        };
        
        const result = await customersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: customerToUpdate }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: "Customer not found" });
        }
        
        res.status(200).json({ _id: id, ...customerToUpdate });
    } catch (e) {
        console.error("Error updating customer:", e);
        res.status(500).send({ message: "Failed to update customer" });
    }
});

// DELETE /api/customers/:id - Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
    if (!customersCollection) {
        return res.status(500).send({ message: "Database not initialized" });
    }
    try {
        const { id } = req.params;
        const result = await customersCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Customer not found" });
        }
        
        res.status(200).send({ message: "Customer deleted successfully" });
    } catch (e) {
        console.error("Error deleting customer:", e);
        res.status(500).send({ message: "Failed to delete customer" });
    }
});

// --- Start Server ---
// Connect to DB and then start the Express server
connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});

