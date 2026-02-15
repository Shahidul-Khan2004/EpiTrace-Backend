import { z } from "zod";

export const createMonitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.url("Invalid URL format"),
  method: z.enum(
    ["GET", "POST", "PUT", "DELETE", "PATCH"],
    "Invalid HTTP method",
  ),
  request_header: z.record(z.any()).optional(),
  request_body: z.any().optional(),
  check_interval: z
    .number()
    .int()
    .min(10, "Check interval must be at least 10 seconds"),
  timeout: z.number().int().min(1, "Timeout must be at least 1 second"),
});
