# Operations Guide

## Runtime Components

### API Server (`server/`)

- Express API
- Auth, monitor CRUD, webhook and token management
- Alert entrypoints and log streaming endpoints

Run:

```bash
cd server
npm run dev
```

### Analysis Worker (`server/src/queue/analysisWorker.js`)

Responsibilities:

- Performs HTTP checks for active monitors
- Stores check history in `monitor_checks`
- Marks monitor status (`UP`/`DOWN`)
- Enqueues `down-monitors` jobs when failures occur

Run:

```bash
cd server
npm run worker:analysis
```

### Down-Monitor Worker (`vmServer/index.js`)

Responsibilities:

- Consumes `down-monitors` jobs
- Runs `run-cline-job.sh` for incident analysis
- Extracts `:::FINAL_ANALYSIS:::` output
- Calls `POST /alert/send`

Run:

```bash
cd vmServer
npm run dev
```

### Code Worker (`vmServer/CodeWorker.js`)

Responsibilities:

- Consumes `code_queue` jobs
- Runs `cline-code-job.sh`
- Streams logs to `/logs/code-worker`
- Extracts PR/commit links from worker output markers

Run:

```bash
cd vmServer
npm run worker:code
```

## End-to-End Runbook

1. Start API + workers (4 terminals)
2. Register/login user
3. Create monitor
4. Attach:
   - one webhook (Slack/Discord)
   - one GitHub token
5. Start monitor
6. Force endpoint failure
7. Verify:
   - monitor history contains DOWN
   - down job created and analyzed
   - alert received with trigger link
8. Open trigger link:
   - code job starts
   - Cline attempts fix and tests
   - branch pushed and PR created

## SSE Log Consumption

Subscribe to all code-worker logs:

```bash
curl -N http://localhost:8080/logs/code-worker/stream
```

Filter by job id:

```bash
curl -N "http://localhost:8080/logs/code-worker/stream?jobId=code-agent-123"
```

## Queue Names

- `analysis-requests`
- `down-monitors`
- `code_queue`

## Common Failures

- `No active GitHub token associated with this monitor`
  - Associate token with monitor using `/github-token/monitor/:monitorId/add/:tokenId`.
- `No trigger payload found for this jobId`
  - Trigger key expired or invalid `jobId`.
- Worker exits with non-zero code
  - Check `cline` availability and credentials.
- No PR link marker in output
  - Verify `cline-code-job.sh` emitted `:::PR_LINK:::` section.
