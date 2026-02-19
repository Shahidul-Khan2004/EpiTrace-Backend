import { ZodError } from "zod";
import { sendAlertSchema } from "../validators/alert.js";
import { sendAlert } from "../../services/notification.js";
import { connection } from "../../config/redis.js";
import { codeQueue } from "../../queue/codeQueue.js";
import { getActiveGithubTokenForMonitor } from "../../services/githubToken.js";

export async function sendAlertController(req, res) {
  try {
    const data = sendAlertSchema.parse(req.body);
    await sendAlert(data);

    return res.status(200).json({
      success: true,
      message: "Alert sent",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    console.error("Failed to send alert:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send alert",
    });
  }
}

export async function triggerCodeAgentController(req, res) {
  try {
    const jobId = String(req.query.jobId || "").trim();
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "jobId query param is required",
      });
    }

    const triggerKey = `agent-trigger:${jobId}`;
    const rawPayload = await connection.get(triggerKey);
    if (!rawPayload) {
      return res.status(404).json({
        success: false,
        error: "No trigger payload found for this jobId",
      });
    }

    const payload = JSON.parse(rawPayload);
    if (!payload.monitorId) {
      return res.status(400).json({
        success: false,
        error: "monitorId is missing in trigger payload",
      });
    }

    let githubToken = null;
    try {
      githubToken = await getActiveGithubTokenForMonitor(payload.monitorId);
    } catch (tokenError) {
      console.error(
        `Failed to fetch GitHub token for monitor ${payload.monitorId}:`,
        tokenError.message,
      );
      return res.status(503).json({
        success: false,
        error: "Failed to fetch GitHub token",
      });
    }

    if (!githubToken) {
      return res.status(400).json({
        success: false,
        error: "No active GitHub token associated with this monitor",
      });
    }

    const queuePayload = {
      ...payload,
      github_access_token: githubToken,
    };

    const safeJobId = `code-agent-${jobId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const queueJob = await codeQueue.add("code-job", queuePayload, {
      jobId: safeJobId,
    });

    return res.status(202).json({
      success: true,
      status: "Agent Started",
      sourceJobId: jobId,
      queueJobId: queueJob.id,
    });
  } catch (error) {
    console.error("Failed to trigger code agent:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to trigger code agent",
    });
  }
}
