#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import axios from "axios";

const SERVER_URL = "https://api.yourapp.com";
const argv = process.argv.slice(2);
const command = argv[0] || "help";
const configuredAgentHome = process.env.AGENT_HOME;
const configDir = configuredAgentHome
  ? path.resolve(configuredAgentHome)
  : path.join(os.homedir(), ".incident-agent");
const configPath = path.join(configDir, "config.json");

function printHelp() {
  console.log(`incident-agent commands:\n\n  incident-agent register --token <token> --repo <repoUrl>\n  incident-agent start\n  incident-agent status`);
}

function getServerUrl() {
  // Hidden default for users; env override keeps local/dev deployment possible.
  return process.env.INCIDENT_SERVER_URL || SERVER_URL;
}

function readConfig() {
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function writeConfig(config) {
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function registerAgent() {
  const tokenIndex = argv.indexOf("--token");
  const repoIndex = argv.indexOf("--repo");
  const token = tokenIndex >= 0 ? argv[tokenIndex + 1] : undefined;
  const repo = repoIndex >= 0 ? argv[repoIndex + 1] : undefined;

  if (!token || !repo) {
    console.error("Missing required flags: --token and --repo");
    process.exit(1);
  }

  const serverUrl = getServerUrl();
  const payload = {
    pairingToken: token,
    repoUrl: repo,
    agentVersion: "1.0.0",
    hostname: os.hostname(),
    platform: `${os.platform()}-${os.arch()}`,
    capabilities: ["docker", "git", "node"],
  };

  let data;
  try {
    const response = await axios.post(`${serverUrl}/v1/agents/register`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    data = response.data || {};
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data || {};
      const errorMessage =
        errorData.error || errorData.message || "Registration failed";
      console.error(
        `Registration failed (${error.response.status}): ${errorMessage}`,
      );
      process.exit(1);
    }

    console.error(`Failed to connect to server: ${serverUrl}`);
    console.error(error.message);
    process.exit(1);
  }

  if (!data.agentId || !data.accessToken) {
    console.error("Registration response missing required fields: agentId/accessToken");
    process.exit(1);
  }

  writeConfig({
    serverUrl,
    agentId: data.agentId,
    accessToken: data.accessToken,
    repo,
    registeredAt: data.registeredAt || new Date().toISOString(),
  });

  console.log("Agent paired successfully.");
  console.log(`Server: ${serverUrl}`);
  console.log(`Agent ID: ${data.agentId}`);
  process.exit(0);
}

function startAgent() {
  const config = readConfig();
  if (!config || !config.agentId || !config.accessToken) {
    console.error("Agent is not registered. Run: incident-agent register --token <token> --repo <repoUrl>");
    process.exit(1);
  }

  console.log("Agent started.");
  console.log(`Server: ${config.serverUrl || getServerUrl()}`);
  console.log(`Agent ID: ${config.agentId}`);
  console.log(`Monitoring jobs for repo: ${config.repo}`);
  console.log("(Hook your existing worker logic here)");
  process.exit(0);
}

function printStatus() {
  const config = readConfig();
  if (!config) {
    console.log("Status: not registered");
    process.exit(0);
  }

  console.log("Status: registered");
  console.log(`Server: ${config.serverUrl || getServerUrl()}`);
  console.log(`Agent ID: ${config.agentId || "n/a"}`);
  console.log(`Repo: ${config.repo}`);
  console.log(`Registered at: ${config.registeredAt}`);
  process.exit(0);
}

if (command === "register") {
  await registerAgent();
}

if (command === "start") {
  startAgent();
}

if (command === "status") {
  printStatus();
}

printHelp();
process.exit(0);
