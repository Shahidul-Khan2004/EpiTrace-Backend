import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis();

export const analysisQueue = new Queue("analysis-requests", {
  connection
});
