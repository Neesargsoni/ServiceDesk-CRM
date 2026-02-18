import express from "express";
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import Customer from "../models/Customer.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { agentOrAdmin, adminOnly } from "../middleware/rbacMiddleware.js";

// 🤖 AI IMPORTS
import {
  classifyTicket,
  analyzeSentiment,
  suggestPriority,
  calculateConfidence,
  generateSmartReplies
} from "../utils/Aiclassifier.js";


const router = express.Router();
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to emit socket events
const emitTicketUpdate = (req, eventName, data) => {
  const io = req.app.get("io");
  if (io) {
    // Broadcast to all connected users
    io.emit(eventName, data);

    // Also send to specific user room if applicable
    if (data.ticket && data.ticket.user) {
      io.to(`user_${data.ticket.user}`).emit(eventName, data);
    }
  }
};

/**
 * GET /api/tickets/my
 */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("GET /api/tickets/my error:", err);
    res.status(500).json({ error: "Server error fetching user tickets" });
  }
});

/**
 * GET /api/tickets/all
 */
router.get("/all", agentOrAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "name email")
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("GET /api/tickets/all error:", err);
    res.status(500).json({ error: "Server error fetching all tickets" });
  }
});

/**
 * GET /api/tickets/assigned
 */
router.get("/assigned", agentOrAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("GET /api/tickets/assigned error:", err);
    res.status(500).json({ error: "Server error fetching assigned tickets" });
  }
});

/**
 * GET /api/tickets/stats
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "user") {
      query.user = req.user.id;
    }

    const total = await Ticket.countDocuments(query);
    const open = await Ticket.countDocuments({ ...query, status: "Open" });
    const inProgress = await Ticket.countDocuments({ ...query, status: "In Progress" });
    const resolved = await Ticket.countDocuments({ ...query, status: "Resolved" });
    const closed = await Ticket.countDocuments({ ...query, status: "Closed" });

    res.json({ total, open, inProgress, resolved, closed });
  } catch (err) {
    console.error("GET /api/tickets/stats error:", err);
    res.status(500).json({ error: "Server error fetching ticket stats" });
  }
});

/**
 * GET /api/tickets/:id
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id)
      .populate("user", "name email role")
      .populate("assignedTo", "name email role");

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const isOwner = ticket.user._id.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === req.user.id;
    const isAdminOrAgent = ["admin", "agent"].includes(req.user.role);

    if (!isOwner && !isAssigned && !isAdminOrAgent) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(ticket);
  } catch (err) {
    console.error("GET /api/tickets/:id error:", err);
    res.status(500).json({ error: "Server error fetching ticket" });
  }
});

/**
 * POST /api/tickets/create
 * 🤖 AI-ENHANCED: Auto-classifies and analyzes sentiment
 */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !description)
      return res.status(400).json({ error: "Title and description are required" });

    console.log("🎫 Creating ticket with AI analysis...");

    // 🤖 AI ANALYSIS (runs in parallel for speed)
    const [aiCategory, aiSentiment] = await Promise.all([
      classifyTicket(title, description),
      analyzeSentiment(description),
    ]);

    // Calculate AI-suggested priority
    const aiSuggestedPriority = suggestPriority(aiSentiment, aiCategory);

    // Calculate confidence score
    const aiConfidence = calculateConfidence(aiCategory, aiSentiment);

    // Use AI-suggested priority if user didn't specify
    const finalPriority = priority || aiSuggestedPriority;

    console.log("🤖 AI Results:", {
      category: aiCategory,
      sentiment: aiSentiment,
      suggestedPriority: aiSuggestedPriority,
      confidence: aiConfidence,
    });

    const ticket = new Ticket({
      user: req.user.id,
      title,
      description,
      priority: finalPriority,
      status: "Open",

      // 🤖 AI fields
      aiCategory,
      aiSentiment,
      aiSuggestedPriority,
      aiConfidence,
      aiProcessed: true,
      aiProcessedAt: new Date(),

      activity: [{
        user: req.user.id,
        userName: req.user.name,
        action: "created",
        details: `Ticket created (AI: ${aiCategory}, ${aiSentiment})`,
        timestamp: new Date()
      }]
    });

    await ticket.save();

    // Populate for socket emission
    await ticket.populate("user", "name email role");

    // 🔴 Emit real-time event
    emitTicketUpdate(req, "ticket_created", {
      ticket,
      message: `New ${aiCategory} ticket created: ${title}`,
      createdBy: req.user.name,
      aiInsights: {
        category: aiCategory,
        sentiment: aiSentiment,
        priority: aiSuggestedPriority,
      }
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket,
      aiInsights: {
        category: aiCategory,
        sentiment: aiSentiment,
        suggestedPriority: aiSuggestedPriority,
        confidence: aiConfidence,
      }
    });

  } catch (err) {
    console.error("POST /api/tickets/create error:", err);
    res.status(500).json({ error: "Server error creating ticket" });
  }
});

/**
 * PUT /api/tickets/:id
 * 🔴 EMITS: ticket_updated
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const isOwner = ticket.user.toString() === req.user.id;
    const isAdminOrAgent = ["admin", "agent"].includes(req.user.role);

    if (!isOwner && !isAdminOrAgent) {
      return res.status(403).json({ error: "Not authorized to update this ticket" });
    }

    const changes = [];
    const allowedFields = ["title", "description", "priority", "status", "assignedTo"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== ticket[field]) {
        changes.push({
          field,
          oldValue: ticket[field],
          newValue: req.body[field]
        });
        ticket[field] = req.body[field];
      }
    });

    if (changes.length > 0) {
      changes.forEach(change => {
        let details = "";
        if (change.field === "status") {
          details = `Status changed from "${change.oldValue}" to "${change.newValue}"`;
        } else if (change.field === "priority") {
          details = `Priority changed from "${change.oldValue}" to "${change.newValue}"`;
        } else if (change.field === "assignedTo") {
          details = change.newValue ? `Ticket assigned` : `Ticket unassigned`;
        } else {
          details = `${change.field} updated`;
        }

        ticket.activity.push({
          user: req.user.id,
          userName: req.user.name,
          action: "updated",
          details,
          timestamp: new Date()
        });
      });
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("user", "name email role")
      .populate("assignedTo", "name email role");

    // 🔴 Emit real-time event
    emitTicketUpdate(req, "ticket_updated", {
      ticket: updatedTicket,
      changes,
      updatedBy: req.user.name
    });

    res.json(updatedTicket);

  } catch (err) {
    console.error("PUT /api/tickets/:id error:", err);
    res.status(500).json({ error: "Server error updating ticket" });
  }
});

/**
 * POST /api/tickets/:id/comment
 * 🔴 EMITS: ticket_commented
 */
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.comments.push({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    });

    ticket.activity.push({
      user: req.user.id,
      userName: req.user.name,
      action: "commented",
      details: "Added a comment",
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("user", "name email role")
      .populate("assignedTo", "name email role");

    // 🔴 Emit real-time event
    emitTicketUpdate(req, "ticket_commented", {
      ticket: updatedTicket,
      comment: text.trim(),
      commentedBy: req.user.name
    });

    res.json(updatedTicket);

  } catch (err) {
    console.error("POST /api/tickets/:id/comment error:", err);
    res.status(500).json({ error: "Server error adding comment" });
  }
});

/**
 * POST /api/tickets/:id/assign
 * 🔴 EMITS: ticket_assigned
 */
router.post("/:id/assign", agentOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });
    if (agentId && !isValidId(agentId)) return res.status(400).json({ error: "Invalid agent id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (agentId) {
      const agent = await Customer.findById(agentId);
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      if (!["agent", "admin"].includes(agent.role)) {
        return res.status(400).json({ error: "User is not an agent or admin" });
      }
    }

    ticket.assignedTo = agentId || null;

    let details = agentId ? "Ticket assigned to agent" : "Ticket unassigned";
    ticket.activity.push({
      user: req.user.id,
      userName: req.user.name,
      action: "assigned",
      details,
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("user", "name email role")
      .populate("assignedTo", "name email role");

    // 🔴 Emit real-time event
    emitTicketUpdate(req, "ticket_assigned", {
      ticket: updatedTicket,
      assignedBy: req.user.name,
      assignedTo: updatedTicket.assignedTo?.name || "Unassigned"
    });

    res.json(updatedTicket);

  } catch (err) {
    console.error("POST /api/tickets/:id/assign error:", err);
    res.status(500).json({ error: "Server error assigning ticket" });
  }
});

/**
 * DELETE /api/tickets/:id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const isOwner = ticket.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this ticket" });
    }

    await Ticket.findByIdAndDelete(id);

    // 🔴 Emit real-time event
    emitTicketUpdate(req, "ticket_deleted", {
      ticketId: id,
      deletedBy: req.user.name
    });

    res.json({ message: "Ticket deleted successfully", ticket });

  } catch (err) {
    console.error("DELETE /api/tickets/:id error:", err);
    res.status(500).json({ error: "Server error deleting ticket" });
  }
});

/**
 * GET /api/tickets/agents/list
 */
router.get("/agents/list", authMiddleware, async (req, res) => {
  try {
    const agents = await Customer.find({
      role: { $in: ["agent", "admin"] }
    }).select("name email role");

    res.json(agents);
  } catch (err) {
    console.error("GET /api/tickets/agents/list error:", err);
    res.status(500).json({ error: "Server error fetching agents" });
  }
});

/**
 * POST /api/tickets/:id/smart-replies
 * 🤖 Generate AI-powered reply suggestions
 */
router.post("/:id/smart-replies", agentOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id)
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    console.log("🤖 Generating smart replies for ticket:", id);

    const suggestions = await generateSmartReplies(ticket);

    res.json({
      ticketId: id,
      suggestions,
      generatedAt: new Date(),
    });

  } catch (err) {
    console.error("POST /api/tickets/:id/smart-replies error:", err);
    res.status(500).json({ error: "Server error generating replies" });
  }
});

/**
 * POST /api/tickets/:id/internal-note
 * 🔒 Private: Agents & Admins Only
 * 🔴 EMITS: ticket_internal_note
 */
router.post("/:id/internal-note", agentOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Note text is required" });
    }

    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ticket id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Add note to the new field
    ticket.internalNotes.push({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    });

    // Log this action (but maybe keep details vague if Activity is public)
    ticket.activity.push({
      user: req.user.id,
      userName: req.user.name,
      action: "internal_note",
      details: "Added an internal note",
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("user", "name email role")
      .populate("assignedTo", "name email role");

    // 🔴 Special Socket Event - Frontend should listen for this ONLY on Agent Dashboard
    emitTicketUpdate(req, "ticket_internal_note", {
      ticketId: id,
      note: text.trim(),
      addedBy: req.user.name,
      ticket: updatedTicket
    });

    res.json(updatedTicket);

  } catch (err) {
    console.error("POST /api/tickets/:id/internal-note error:", err);
    res.status(500).json({ error: "Server error adding internal note" });
  }
});

export default router;