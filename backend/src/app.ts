import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import apiRoutes from "./routes/apiRoutes";
import trainingRoutes from "./routes/trainingRoutes";
import documentLinkRoutes from "./routes/documentLinkRoutes";
import trainingRecordRoutes from "./routes/trainingRecordRoutes";
import learningProgressRoutes from "./routes/learningProgressRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import trainingMatrixRoutes from "./routes/trainingMatrixRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import aiAnalyticsRoutes from "./routes/aiAnalyticsRoutes";
import governanceRoutes from "./routes/governanceRoutes";


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/document-links", documentLinkRoutes);
app.use("/api/training-records", trainingRecordRoutes);
app.use("/api/learning-progress", learningProgressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/training-matrix", trainingMatrixRoutes); // Sprint 3: Training Matrix
app.use("/api/analytics", analyticsRoutes); // Sprint 4: Analytics & Governance
app.use("/api/analytics/ai", aiAnalyticsRoutes); // Sprint 4: AI Governance Assistant
app.use("/api/governance", governanceRoutes); // Sprint 5: Governance Config Versioning

app.use("/api", apiRoutes);
app.use('/uploads', express.static('uploads'));

export default app;
