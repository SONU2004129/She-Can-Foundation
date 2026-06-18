import express from "express";
import path from "path";
import fs from "fs";
import { MongoClient, ObjectId } from "mongodb";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to local fallback database file
const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "submissions.json");

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_DB_PATH)) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify([], null, 2), "utf8");
}

// MongoDB Connection Setup (Lazy & Fail-Safe)
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

// Dynamically check both MONGODB_URI and MONGO_URI environment keys, then sanitize.
const rawUri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
const MONGO_URI = (rawUri.startsWith("mongodb://") || rawUri.startsWith("mongodb+srv://")) ? rawUri : null;

let DB_NAME = "sheCanFoundationDB";
const COLLECTION_NAME = "submissions";

// Automatically parse custom database name from the connection string if present
if (MONGO_URI) {
  try {
    const parsedUri = MONGO_URI.split("?")[0]; // remove query params
    const lastSlashIndex = parsedUri.lastIndexOf("/");
    // Ensure the slash isn't part of the protocol (e.g. mongodb:// or mongodb+srv://)
    if (lastSlashIndex > 12) { 
      const dbFromUri = parsedUri.substring(lastSlashIndex + 1);
      if (dbFromUri && dbFromUri.trim() !== "") {
        DB_NAME = dbFromUri;
      }
    }
  } catch (err) {
    console.warn("[DB] Failed parsing custom database name from MONGODB_URI", err);
  }
}

async function getMongoDBCollection() {
  if (!MONGO_URI) {
    return null;
  }
  try {
    if (!mongoClient) {
      console.log("[DB] Connecting to MongoDB...");
      mongoClient = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      await mongoClient.connect();
      isMongoConnected = true;
      console.log("[DB] MongoDB Connected Successfully!");
    }
    const db = mongoClient.db(DB_NAME);
    return db.collection(COLLECTION_NAME);
  } catch (err: any) {
    console.error("[DB] MongoDB connection failed. Falling back to local JSON database.", err.message);
    isMongoConnected = false;
    mongoClient = null; // retry next time
    return null;
  }
}

// Local Database Helpers
function readLocalSubmissions(): any[] {
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[Local DB] Error reading file, resetting:", err);
    return [];
  }
}

function writeLocalSubmissions(data: any[]) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[Local DB] Error writing file:", err);
  }
}

// Standard Database API
async function getSubmissionsList() {
  const collection = await getMongoDBCollection();
  if (collection) {
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      id: doc.id || doc._id.toString(),
    }));
  } else {
    const list = readLocalSubmissions();
    // Sort descending by date
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

async function addSubmissionItem(item: {
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: string;
  notes?: string;
}) {
  const collection = await getMongoDBCollection();
  const id = Math.random().toString(36).substr(2, 9);
  const newItem = { ...item, id };

  if (collection) {
    const result = await collection.insertOne(newItem);
    return { ...newItem, _id: result.insertedId.toString() };
  } else {
    const list = readLocalSubmissions();
    list.push(newItem);
    writeLocalSubmissions(list);
    return newItem;
  }
}

async function deleteSubmissionItem(id: string) {
  const collection = await getMongoDBCollection();
  if (collection) {
    // Try matching both ObjectId and string custom ID
    let deleteResult = await collection.deleteOne({ id });
    if (deleteResult.deletedCount === 0) {
      try {
        deleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      } catch (e) {}
    }
    return deleteResult.deletedCount > 0;
  } else {
    const list = readLocalSubmissions();
    const filteredList = list.filter((item) => item.id !== id && item._id !== id);
    if (list.length !== filteredList.length) {
      writeLocalSubmissions(filteredList);
      return true;
    }
    return false;
  }
}

async function updateSubmissionItem(id: string, updates: Partial<{ status: string; notes: string }>) {
  const collection = await getMongoDBCollection();
  if (collection) {
    // Try by 'id' field first
    let result = await collection.updateOne({ id }, { $set: updates });
    if (result.matchedCount === 0) {
      try {
        result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      } catch (e) {}
    }
    return result.matchedCount > 0;
  } else {
    const list = readLocalSubmissions();
    const index = list.findIndex((item) => item.id === id || item._id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      writeLocalSubmissions(list);
      return true;
    }
    return false;
  }
}

// --- ADMIN AUTH CONFIG ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Middleware to protect admin routes
function runAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized. Authorization header is missing." });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: "Access Denied. Invalid Admin Password." });
  }
}

// --- REST API ENDPOINTS ---

// Get Database Connection Status
app.get("/api/db-status", async (req, res) => {
  // Try to connect to check status
  await getMongoDBCollection();
  res.json({
    connected: isMongoConnected,
    type: isMongoConnected ? "MongoDB Atlas" : "Local JSON persistent file",
    mongoUriConfigured: !!MONGO_URI,
  });
});

// Submit/Create Form
app.post("/api/submissions", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Backend Form Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Please enter your name." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({ error: "Your message must be at least 5 characters long." });
    }

    const newItem = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: "new",
      notes: "",
    };

    const saved = await addSubmissionItem(newItem);
    console.log(`[Form Submit] Successfully received submission from: ${newItem.email}`);
    res.status(201).json({ success: true, message: "Form Submitted Successfully", data: saved });
  } catch (err: any) {
    console.error("[Form Submit Error]", err);
    res.status(500).json({ error: "Internal server error while processing form." });
  }
});

// Admin Authentication check
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD, message: "Logged in successfully to Admin panel." });
  } else {
    res.status(401).json({ error: "Invalid password. Access denied." });
  }
});

// Admin: Retrieve All Submissions
app.get("/api/admin/submissions", runAdminAuth, async (req, res) => {
  try {
    const submissions = await getSubmissionsList();
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve submissions." });
  }
});

// Admin: Update Submission Status or Notes
app.patch("/api/admin/submissions/:id", runAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updates: Partial<{ status: string; notes: string }> = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const updated = await updateSubmissionItem(id, updates);
    if (updated) {
      res.json({ success: true, message: "Submission updated updated successfully." });
    } else {
      res.status(404).json({ error: "Submission item not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update submission." });
  }
});

// Admin: Delete Submission
app.delete("/api/admin/submissions/:id", runAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSubmissionItem(id);
    if (deleted) {
      res.json({ success: true, message: "Submissions item deleted successfully." });
    } else {
      res.status(404).json({ error: "Submission item not found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete submission." });
  }
});

// Create Full-Stack App: Vite Integration Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] She Can Foundation server running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
