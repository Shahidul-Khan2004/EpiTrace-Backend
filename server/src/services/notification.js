import axios from "axios";
import { pool } from "../config/db.js";

/**
 * Format and send alert to Slack
 */
async function sendToSlack(data, webhookUrl) {
  if (!webhookUrl) throw new Error("Webhook URL not configured");

  const isAiAlert =
    data.monitorId !== undefined ||
    data.jobId !== undefined ||
    data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const endpointUrl = data.endpoint || data.url;
    const payload = {
      attachments: [
        {
          color: "danger",
          title: "Ai analysis failed",
          fields: [
            {
              title: "Job ID",
              value: String(data.jobId),
              short: true,
            },
            ...(endpointUrl
              ? [{ title: "Endpoint", value: endpointUrl, short: false }]
              : []),
            {
              title: "Error",
              value: aiErrorMessage,
              short: false,
            },
            {
              title: "Repository",
              value: `<${data.git_hub_repo}|View Repo>`,
              short: false,
            },
          ],
          footer: "EpiTrace AI Worker",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  if (data.extractedAnalysis) {
    const endpointUrl = data.endpoint || data.url;
    const payload = {
      attachments: [
        {
          color: "#d97706",
          title: "AI Incident Analysis",
          fields: [
            {
              title: "Job ID",
              value: String(data.jobId),
              short: true,
            },
            ...(endpointUrl
              ? [{ title: "Endpoint", value: endpointUrl, short: false }]
              : []),
            ...(data.error_message
              ? [{ title: "Error", value: data.error_message, short: false }]
              : []),
            {
              title: "Repository",
              value: `<${data.git_hub_repo}|View Repo>`,
              short: false,
            },
            {
              title: "Analysis",
              value: data.extractedAnalysis,
              short: false,
            },
          ],
          footer: "EpiTrace AI Worker",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

/**
 * Format and send alert to Discord
 */
async function sendToDiscord(data, webhookUrl) {
  if (!webhookUrl) throw new Error("Discord webhook URL not configured");

  const isAiAlert =
    data.monitorId !== undefined ||
    data.jobId !== undefined ||
    data.git_hub_repo !== undefined;

  if (isAiAlert && !data.extractedAnalysis) {
    const aiErrorMessage = data.error_message || "Analysis failed";
    const endpointUrl = data.endpoint || data.url;
    const payload = {
      embeds: [
        {
          title: "Ai analysis failed",
          color: 16711680,
          fields: [
            {
              name: "Job ID",
              value: String(data.jobId),
              inline: true,
            },
            ...(endpointUrl
              ? [{ name: "Endpoint", value: endpointUrl, inline: false }]
              : []),
            {
              name: "Error",
              value: aiErrorMessage,
              inline: false,
            },
            {
              name: "Repository",
              value: `[View](${data.git_hub_repo})`,
              inline: false,
            },
          ],
          footer: { text: "EpiTrace AI Worker" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  if (data.extractedAnalysis) {
    const endpointUrl = data.endpoint || data.url;
    const payload = {
      embeds: [
        {
          title: "AI Incident Analysis",
          color: 16760576,
          fields: [
            {
              name: "Job ID",
              value: String(data.jobId),
              inline: true,
            },
            ...(endpointUrl
              ? [{ name: "Endpoint", value: endpointUrl, inline: false }]
              : []),
            ...(data.error_message
              ? [{ name: "Error", value: data.error_message, inline: false }]
              : []),
            {
              name: "Repository",
              value: `[View](${data.git_hub_repo})`,
              inline: false,
            },
            {
              name: "Analysis",
              value: data.extractedAnalysis,
              inline: false,
            },
          ],
          footer: { text: "EpiTrace AI Worker" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return axios.post(webhookUrl, payload);
  }

  throw new Error("Unsupported alert payload: expected AI analysis data");
}

async function getMonitorNotificationSettings(monitorId) {
  const { rows } = await pool.query(
    "SELECT notification_provider, notification_webhook_url FROM monitors WHERE id = $1",
    [monitorId],
  );

  if (!rows.length) throw new Error("Monitor not found");

  return rows[0];
}

/**
 * Send alert to configured provider
 */
export async function sendAlert(data) {
  const { notification_provider, notification_webhook_url } =
    await getMonitorNotificationSettings(data.monitorId);

  if (notification_provider === "slack") {
    return sendToSlack(data, notification_webhook_url);
  } else if (notification_provider === "discord") {
    return sendToDiscord(data, notification_webhook_url);
  } else {
    throw new Error(
      `Unknown notification provider: ${notification_provider}`,
    );
  }
}
