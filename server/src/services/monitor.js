import { pool } from "../config/db.js";
import { analysisQueue } from "../queue/analysisQueue.js";
import { retry } from "../utils/retry.js";

export async function createMonitor(userId, data) {
  const client = await pool.connect();

  try {
    // start transaction
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO monitors
      (user_id, name, url, method, request_header, request_body, check_interval, timeout, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const values = [
      userId,
      data.name,
      data.url,
      data.method,
      data.request_header || {},
      data.request_body || {},
      data.check_interval,
      data.timeout,
      data.is_active || false,
    ];

    const result = await client.query(insertQuery, values);
    const monitor = result.rows[0];

    // retry queue push
    if (monitor.is_active) {
      await retry(() =>
        analysisQueue.add("monitor-created", {
          monitorId: monitor.id,
        }),
      );
    }

    // commit only if queue succeeds
    await client.query("COMMIT");

    return monitor;
  } catch (error) {
    // rollback on ANY failure
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

export async function startMonitor(userId, monitorId) {

  const { rows } = await pool.query(
    "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
    [monitorId, userId]
  );

  if (!rows.length) throw new Error("Monitor not found");

  const monitor = rows[0];
  if (monitor.is_active) throw new Error("Monitor already active");
  else {
    await pool.query(
      "UPDATE monitors SET is_active = true WHERE id = $1",
      [monitorId]
    );
  }

  await analysisQueue.add("monitor-started", {
    monitorId
  });
}
