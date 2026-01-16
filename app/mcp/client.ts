import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { MCPClientLogger } from "./logger";
import {
  ListToolsResponse,
  McpRequestMessage,
  ServerStdioConfig,
  ServerWSConfig,
} from "./types";
import { z } from "zod";

const logger = new MCPClientLogger();

export async function createClient(
  id: string,
  config: ServerStdioConfig | ServerWSConfig,
): Promise<Client> {
  logger.info(`Creating client for ${id}...`);
  const client = new Client(
    {
      name: `nextchat-mcp-client-${id}`,
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );
  if (config.kind === "stdio") {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v as string]),
        ),
        ...(config.env || {}),
      },
    });
    await client.connect(transport);
    return client;
  } else if (config.kind === "ws") {
    let url = new URL(config.url);
    if (config.api_key) {
      url.searchParams.set("api_key", config.api_key);
    }
    const transport = new WebSocketClientTransport(url);
    await client.connect(transport);
  }
  return client;
}

export async function removeClient(client: Client) {
  logger.info(`Removing client...`);
  await client.close();
}

export async function listTools(client: Client): Promise<ListToolsResponse> {
  return client.listTools();
}

export async function executeRequest(
  client: Client,
  request: McpRequestMessage,
) {
  return client.request(request, z.any());
}
