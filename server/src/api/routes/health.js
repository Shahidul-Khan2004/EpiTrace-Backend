import express from "express";
import queryDB from "../../config/db.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    const result = await queryDB("SELECT NOW() as time, version();");
    res.status(200).json({
      status: "RUNNING",
      timestamp: new Date().toISOString(),
      dbTime: result.rows[0].time,
      dbVersion: result.rows[0].version,
    });
  } catch (err) {
    console.error("Health Check Error", err.message, err.stack);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

router.get("/dev/reset-db", async (req, res) => {
  try {
    const { rows } = await queryDB(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'`,
    );

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        message: "No tables found in public schema",
      });
    }

    const tableList = rows
      .map(({ tablename }) => `"public"."${String(tablename).replace(/"/g, "\"\"")}"`)
      .join(", ");

    await queryDB(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

    return res.status(200).json({
      success: true,
      message: "Database reset completed",
      truncatedTables: rows.length,
    });
  } catch (err) {
    console.error("DB reset error", err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: "Failed to reset database",
    });
  }
});

export default router;
