import { NextRequest } from "next/server";

const ITEM_PATH = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const FORWARDED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
const MAX_BODY_BYTES = 9 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 15000;
const DEFAULT_BACKEND_URL = "http://localhost:8000";

function resolveBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BACKEND_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(DEFAULT_BACKEND_URL);
    }
    return url;
  } catch {
    return new URL(DEFAULT_BACKEND_URL);
  }
}

function mapUpstreamPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments[0] !== "inventory") return null;
  // images routes
  if (segments.length >= 2 && segments[1] === "images") {
    if (segments.length === 2) return "inventory/images/";
    if (segments.length === 3 && ITEM_PATH.test(segments[2])) {
      return `inventory/images/${segments[2]}/`;
    }
    return null;
  }
  // existing routes
  if (segments.length === 1) return "inventory/";
  if (segments.length === 2 && segments[1] === "bulk-stock") {
    return "inventory/bulk-stock/";
  }
  if (segments.length === 2 && ITEM_PATH.test(segments[1])) {
    return `inventory/${segments[1]}/`;
  }
  return null;
}

async function forward(
  request: NextRequest,
  path: string[],
): Promise<Response> {
  const upstreamPath = mapUpstreamPath(path);
  if (!upstreamPath) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }

  const method = request.method.toUpperCase();
  if (!FORWARDED_METHODS.has(method)) {
    return Response.json(
      { detail: "Method not allowed." },
      { status: 405, headers: { allow: "GET, POST, PATCH, DELETE" } },
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return Response.json(
      { detail: "Authentication credentials were not provided." },
      { status: 401 },
    );
  }

  const needsBody = method === "POST" || method === "PATCH";
  let body: string | undefined;
  if (needsBody) {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return Response.json({ detail: "Payload too large." }, { status: 413 });
    }
    body = raw;
  }

  const base = resolveBaseUrl();
  const prefix = base.pathname.replace(/\/+$/, "");
  const target = new URL(`${prefix}/api/${upstreamPath}`, base);
  if (target.origin !== base.origin) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }

  const upstreamHeaders = new Headers({
    accept: "application/json",
    authorization,
  });
  if (body !== undefined) {
    upstreamHeaders.set("content-type", "application/json");
  }

  try {
    const upstream = await fetch(target, {
      method,
      body,
      redirect: "error",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (upstream.status === 204) {
      return new Response(null, { status: 204 });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (upstream.status >= 500 || !contentType.includes("json")) {
      return Response.json({ detail: "Backend error." }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: { "cache-control": "no-store", "content-type": contentType },
    });
  } catch {
    return Response.json({ detail: "Backend unavailable." }, { status: 502 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return forward(request, path);
}
