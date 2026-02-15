import "dotenv/config";
import express from "express";
import healthRouter from "./src/api/routes/health.js";
import authRouter from "./src/api/routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use("/", healthRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
