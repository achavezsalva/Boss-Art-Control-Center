import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import si from "systeminformation";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import extract from "extract-zip";
import { initDb, get, query, run } from "./server/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "artchie-secret-key";

const logEvent = async (message: string, level: string = 'info', source: string = 'system') => {
  try {
    await run("INSERT INTO logs (message, level, source) VALUES (?, ?, ?)", [message, level, source]);
  } catch (err) {
    console.error("Failed to log event:", err);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function startServer() {
  console.log("Starting server process...");
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Non-blocking DB init
  initDb().then(() => {
    console.log("Database initialized successfully.");
  }).catch(err => {
    console.error("Database initialization failed:", err);
  });
  
  // Ensure directories exist
  const dirs = [
    path.join(process.cwd(), 'storage'),
    path.join(process.cwd(), 'storage', 'projects'),
    path.join(process.cwd(), 'storage', 'backups')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  const app = express();
  
  // 1. ABSOLUTE TOP: Log every single request to see if it even reaches Express
  app.use((req, res, next) => {
    const contentLength = req.headers['content-length'];
    console.log(`[INCOMING] ${new Date().toISOString()} ${req.method} ${req.url} - Size: ${contentLength || 'unknown'} bytes`);
    
    // Catch 413 and other errors immediately
    const originalSend = res.send;
    res.send = function(body) {
      if (res.statusCode >= 400) {
        console.error(`[RESPONSE ERROR] ${res.statusCode} for ${req.method} ${req.url} - ${body?.toString().substring(0, 100)}`);
      }
      return originalSend.apply(res, arguments as any);
    };
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", time: new Date().toISOString() });
  });

  // --- Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Project Management (Multer Setup) - Move up to avoid general body-parser interference
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'storage', 'projects');
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
  });

  // Placement: BEFORE express.json() to ensure multer handles the multipart stream entirely
  app.post("/api/deploy", authenticateToken, (req, res, next) => {
    console.log(`[DEPLOY] Starting upload: ${req.headers['content-length']} bytes`);
    upload.single('project')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: "File too large. Max 1GB permitted on server, but proxy may have lower limits (e.g. 32MB)." });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        console.error("Unknown Upload Error:", err);
        return res.status(500).json({ message: "Upload failed" });
      }
      next();
    });
  }, async (req, res) => {
    const { name } = req.body;
    const projectFile = req.file;

    if (!projectFile) return res.status(400).json({ message: "No file uploaded" });

    const projectsDir = path.join(process.cwd(), 'storage', 'projects');
    const extractPath = path.join(projectsDir, name.replace(/\s+/g, '-').toLowerCase());
    const zipPath = path.join(projectsDir, projectFile.filename);

    try {
      console.log(`Starting deployment for: ${name}, file: ${projectFile.filename}`);
      
      // Ensure target extraction directory exists
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }

      console.log(`Extracting ${zipPath} to ${extractPath}...`);
      await extract(zipPath, { dir: extractPath });
      console.log("Extraction complete.");

      await run(
        "INSERT INTO projects (name, path, status) VALUES (?, ?, ?)",
        [name, extractPath, 'running']
      );
      
      await logEvent(`Project ${name} uploaded and extracted successfully.`, 'info', 'projects');
      res.json({ message: "Project deployed and extracted successfully" });
    } catch (error) {
      console.error("Deployment API Error:", error);
      await logEvent(`Deployment failed for ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 'projects');
      res.status(500).json({ message: "Deployment failed during extraction" });
    }
  });

  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ limit: '1024mb', extended: true }));

  const PORT = 3000;

  console.log("Setting up middleware and routes...");
  // AI Setup
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await get("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      await logEvent(`User logged in: ${user.email}`, 'info', 'auth');
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Projects
  app.get("/api/projects", authenticateToken, async (req, res) => {
    const projects = await query("SELECT * FROM projects");
    res.json(projects);
  });

  // System Metrics
  app.get("/api/system/metrics", authenticateToken, async (req, res) => {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const time = si.time();
    res.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      disk: 45, // Placeholder
      uptime: Math.round(time.uptime / 3600 / 24), // Days
    });
  });

  // AI Deployment Assistant (Gemini)
  app.post("/api/ai/analyze", authenticateToken, async (req, res) => {
    const { errorLogs, context } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Analyze these build error logs for a ${context.type} project:\n\n${errorLogs}\n\nSuggest solutions and a proper PM2/Nginx config if applicable.`);
      res.json({ analysis: result.response.text() });
    } catch (error) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ message: "AI Analysis failed" });
    }
  });

  // Domain Management
  app.get("/api/domains", authenticateToken, async (req, res) => {
    // In a real app, parse Nginx conf or DB
    res.json([
      { id: 1, name: "app.artchie.local", target: "localhost:3000", ssl: true },
      { id: 2, name: "blog.test", target: "localhost:8080", ssl: false }
    ]);
  });

  // Backups
  app.get("/api/backups", authenticateToken, async (req, res) => {
    const backups = await query("SELECT * FROM backups ORDER BY created_at DESC");
    res.json(backups);
  });

  // Global Logs
  app.get("/api/logs", authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await query("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?", [limit]);
    res.json(logs);
  });

  // Project Management
  app.patch("/api/projects/:id/status", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await run("UPDATE projects SET status = ? WHERE id = ?", [status, id]);
      const project = await query("SELECT name FROM projects WHERE id = ?", [id]);
      await logEvent(`Project ${project[0].name} status changed to ${status}`, 'info', 'projects');
      res.json({ message: "Status updated" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const project = await query("SELECT name FROM projects WHERE id = ?", [id]);
      if (project.length > 0) {
        await logEvent(`Project deleted: ${project[0].name}`, 'warn', 'projects');
      }
      await run("DELETE FROM projects WHERE id = ?", [id]);
      res.json({ message: "Project deleted" });
    } catch (err) {
      res.status(500).json({ message: "Deletion failed" });
    }
  });

  app.post("/api/backups/create", authenticateToken, async (req, res) => {
    try {
      const filename = `backup-${Date.now()}.zip`;
      // Reality: use archiver package to ZIP storage and DB
      await run("INSERT INTO backups (filename) VALUES (?)", [filename]);
      await logEvent(`System backup created: ${filename}`, 'info', 'backup');
      res.json({ message: "Backup created", filename });
    } catch (error) {
      res.status(500).json({ message: "Backup failed" });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware (SPA mode)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware (SPA) attached.");
  } else {
    console.log("Setting up static production server...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  });

  console.log(`Bout to listen on port ${PORT}...`);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`BOSS ART Control Center running on http://localhost:${PORT}`);
  });

  // Increase timeouts for large file uploads
  server.timeout = 600000; // 10 minutes
  server.headersTimeout = 600000;
  server.requestTimeout = 600000;
  server.keepAliveTimeout = 600000;
}

startServer().catch(err => {
  console.error("Critical server startup failure:", err);
});
