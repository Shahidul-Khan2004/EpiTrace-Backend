#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const argv = process.argv.slice(2);
const command = argv[0] || "help";
const configDir = path.join(os.homedir(), ".incident-agent");
const configPath = path.join(configDir, "config.json");

function printHelp() {
  console.log(`incident-agent commands:\n\n  incident-agent register --token <token> --repo <repoUrl>\n  incident-agent start\n  incident-agent status`);
}

function readConfig() {
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function writeConfig(config) {
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

if (command === "register") {
  const tokenIndex = argv.indexOf("--token");
  const repoIndex = argv.indexOf("--repo");
  const token = tokenIndex >= 0 ? argv[tokenIndex + 1] : undefined;
  const repo = repoIndex >= 0 ? argv[repoIndex + 1] : undefined;

  if (!token || !repo) {
    console.error("Missing required flags: --token and --repo");
    process.exit(1);
  }

  writeConfig({
    token,
    repo,
    registeredAt: new Date().toISOString(),
  });

  console.log("Agent registered locally.");
  process.exit(0);
}

if (command === "start") {
  const config = readConfig();
  if (!config) {
    console.error("Agent is not registered. Run: incident-agent register --token <token> --repo <repoUrl>");
    process.exit(1);
  }

  console.log("Agent started.");
  console.log(`Monitoring jobs for repo: ${config.repo}`);
  console.log("(Hook your existing worker logic here)");
  process.exit(0);
}

if (command === "status") {
  const config = readConfig();
  if (!config) {
    console.log("Status: not registered");
    process.exit(0);
  }

  console.log("Status: registered");
  console.log(`Repo: ${config.repo}`);
  console.log(`Registered at: ${config.registeredAt}`);
  process.exit(0);
}

printHelp();
process.exit(0);
