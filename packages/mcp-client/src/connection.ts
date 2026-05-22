import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Opens an MCP connection to the garmin-mcp server.
 *
 * Two transports are supported:
 *  - `http`  — connects to a long-lived garmin-mcp container at GARMIN_MCP_URL.
 *              This is what docker-compose uses.
 *  - `stdio` — spawns `uvx garmin-mcp` locally. Handy for development on a
 *              machine that has uv + the Garmin token file.
 *
 * Selected via GARMIN_MCP_TRANSPORT (defaults to `http`).
 */
export async function connectGarminMcp(): Promise<Client> {
  const transportKind = process.env.GARMIN_MCP_TRANSPORT ?? "http";
  const client = new Client({ name: "meteor-health", version: "0.1.0" });

  if (transportKind === "stdio") {
    const transport = new StdioClientTransport({
      command: "uvx",
      args: [
        "--python",
        "3.12",
        "--from",
        "git+https://github.com/Taxuspt/garmin_mcp",
        "garmin-mcp",
      ],
      env: process.env as Record<string, string>,
    });
    await client.connect(transport);
    return client;
  }

  const url = process.env.GARMIN_MCP_URL ?? "http://garmin-mcp:8080/mcp";
  const transport = new StreamableHTTPClientTransport(new URL(url));
  await client.connect(transport);
  return client;
}
