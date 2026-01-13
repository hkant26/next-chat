import md5 from "spark-md5";
import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";

const serverConfig = getServerSideConfig();

const storeUrl = () =>
  `https://api.cloudflare.com/client/v4/accounts/${serverConfig.cloudflareAccountId}/storage/kv/namespaces/${serverConfig.cloudflareKVNamespaceId}`;

const storeHeaders = () => ({
  Authorization: `Bearer ${serverConfig.cloudflareKVApiKey}`,
});

async function saveArtifact(req: NextRequest) {
  const payload = await req.text();
  const artifactId = md5.hash(payload).trim();
  const body: {
    key: string;
    value: string;
    expiration_ttl?: number;
  } = {
    key: artifactId,
    value: payload,
  };

  try {
    const ttl = parseInt(serverConfig.cloudflareKVTTL as string);
    if (Number.isFinite(ttl) && ttl > 60) {
      body.expiration_ttl = ttl;
    }
  } catch (error) {
    console.error("Failed to parse Cloudflare KV TTL", error);
  }

  const response = await fetch(`${storeUrl()}/bulk`, {
    headers: {
      ...storeHeaders(),
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify([body]),
  });

  const result = await response.json();
  console.log("save data", result);

  if (result?.success) {
    return NextResponse.json(
      { code: 0, id: artifactId, result },
      { status: response.status },
    );
  }

  return NextResponse.json(
    { error: true, msg: "Save data error" },
    { status: 400 },
  );
}

async function readArtifact(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: true, msg: "Missing artifact id" },
      { status: 400 },
    );
  }

  const response = await fetch(`${storeUrl()}/values/${id}`, {
    headers: storeHeaders(),
    method: "GET",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function POST(req: NextRequest) {
  return saveArtifact(req);
}

export async function GET(req: NextRequest) {
  return readArtifact(req);
}

export const runtime = "edge";
