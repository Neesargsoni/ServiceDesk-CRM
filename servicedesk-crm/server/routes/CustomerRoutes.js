// server/routes/customerRoutes.js
import express from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Ticket from "../models/Ticket.js"; // optional, only used if you want cascade delete
import bcrypt from "bcrypt";

const router = express.Router();

// Helpers
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/customers
 * Create a new customer
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!password) return res.status(400).json({ error: "Password is required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, phone, password: hashedPassword });

    return res.status(201).json(customer);
  } catch (err) {
    console.error("Create customer error:", err);
    return res.status(500).json({ error: "Server error creating customer" });
  }
});

/**
 * GET /api/customers
 * Get all customers
 */
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    return res.json(customers);
  } catch (err) {
    console.error("Get customers error:", err);
    return res.status(500).json({ error: "Server error fetching customers" });
  }
});

/**
 * GET /api/customers/:id
 * Get single customer by id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid customer id" });

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    return res.json(customer);
  } catch (err) {
    console.error("Get customer error:", err);
    return res.status(500).json({ error: "Server error fetching customer" });
  }
});

/**
 * PUT /api/customers/:id
 * Update a customer
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid customer id" });

    const updates = {};
    const allowed = ["name", "email", "phone"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const updated = await Customer.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "Customer not found" });

    return res.json(updated);
  } catch (err) {
    console.error("Update customer error:", err);
    return res.status(500).json({ error: "Server error updating customer" });
  }
});

/**
 * DELETE /api/customers/:id
 * Delete a customer (optionally cascade delete tickets)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid customer id" });

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // OPTIONAL: Remove all tickets associated with this customer
    // await Ticket.deleteMany({ customerId: id });

    return res.json({ message: "Customer deleted", customer });
  } catch (err) {
    console.error("Delete customer error:", err);
    return res.status(500).json({ error: "Server error deleting customer" });
  }
});

export default router;
