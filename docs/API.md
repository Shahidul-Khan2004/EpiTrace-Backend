# API Reference

Base URL (local default): `http://localhost:8080`

## Authentication

Protected endpoints require:

`Authorization: Bearer <jwt-token>`

Get token from:

- `POST /auth/register`
- `POST /auth/login`

## Public Endpoints

### Health

- `GET /health`
  - Checks service and database connectivity.

### Dev Utility

- `GET /dev/reset-db`
  - Truncates all tables in public schema.
  - Use only in local/dev environments.

### Auth

- `POST /auth/register`
  - Body:
    ```json
    {
      "email": "user@example.com",
      "password": "secret123",
      "rePassword": "secret123"
    }
    ```
- `POST /auth/login`
  - Body:
    ```json
    {
      "email": "user@example.com",
      "password": "secret123"
    }
    ```

### Alerts

- `POST /alert/send`
  - Accepts either:
    - monitor alert payload
    - analysis alert payload
- `GET /alert/trigger-agent?jobId=<jobId>`
  - Starts code-fix Cline job from stored trigger payload.

### Code Worker Logs

- `POST /logs/code-worker`
  - Internal endpoint used by `vmServer/CodeWorker.js`.
- `GET /logs/code-worker/stream`
  - SSE stream of live logs.
  - Optional: `?jobId=<id>`

## Protected Endpoints

### Monitors

- `POST /monitor/create`
- `GET /monitor?limit=50&offset=0`
- `GET /monitor/:id`
- `PATCH /monitor/:id`
- `DELETE /monitor/:id`
- `POST /monitor/start/:id`
- `POST /monitor/pause/:id`
- `POST /monitor/resume/:id`
- `GET /monitor/:id/history?limit=100&offset=0`

Create monitor body:

```json
{
  "name": "Prod API",
  "url": "https://api.example.com/health",
  "repo_link": "https://github.com/org/repo",
  "method": "GET",
  "request_header": {},
  "request_body": {},
  "is_active": true,
  "check_interval": 30,
  "timeout": 5
}
```

### Webhooks (Slack/Discord)

- `POST /webhook`
- `GET /webhook`
- `GET /webhook/:id`
- `PATCH /webhook/:id`
- `DELETE /webhook/:id`
- `POST /webhook/monitor/:monitorId/add/:webhookId`
- `DELETE /webhook/monitor/:monitorId/remove/:webhookId`
- `GET /webhook/monitor/:monitorId`

Create webhook body:

```json
{
  "provider": "slack",
  "webhook_url": "https://hooks.slack.com/services/..."
}
```

### GitHub Tokens

- `POST /github-token`
- `GET /github-token`
- `GET /github-token/:id`
- `PATCH /github-token/:id`
- `DELETE /github-token/:id`
- `POST /github-token/monitor/:monitorId/add/:tokenId`
- `DELETE /github-token/monitor/:monitorId/remove/:tokenId`
- `GET /github-token/monitor/:monitorId`

Create token body:

```json
{
  "access_token": "ghp_xxx"
}
```

## Swagger UI

- `GET /docs`
- `GET /api-docs`
