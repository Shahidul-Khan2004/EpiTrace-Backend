import { Worker } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import pool from "../config/db.js";
import { analysisQueue } from "./analysisQueue.js";

const connection = new IORedis();

const worker = new Worker(
  "analysis-requests",
  async (job) => {
    switch (job.name) {
      case "monitor-created":
      case "monitor-started":
        await handleMonitorStart(job.data.monitorId);
        break;

      case "monitor-check":
        await performCheck(job.data.monitorId);
        break;

      default:
        console.log("Unknown job:", job.name);
    }
  },
  { connection }
);

console.log("Analysis worker running...");
