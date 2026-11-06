import { NextRequest } from "next/server";

const ALLOWED_RESOURCES = new Set(["brands", "cars", "categories"]);
const SEGMENT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_QUERY_LENGTH = 1024;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json(
      { detail: "Method not allowed." },
      { status: 405, headers: { allow: "GET, HEAD" } },
    );
  }

  const { path } = await params;
  if (path.length === 0 || path.length > 2) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }
  if (!ALLOWED_RESOURCES.has(path[0])) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }
  if (!path.every((segment) => SEGMENT_PATTERN.test(segment))) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }

  const search = new URL(request.url).search;
  if (search.length > MAX_QUERY_LENGTH) {
    return Response.json({ detail: "Query string too long." }, { status: 414 });
  }

  const base = resolveBaseUrl();
  const prefix = base.pathname.replace(/\/+$/, "");
  const target = new URL(
    `${prefix}/api/${path.map(encodeURIComponent).join("/")}/`,
    base,
  );
  if (target.origin !== base.origin) {
    return Response.json({ detail: "Not found." }, { status: 404 });
  }
  target.search = search;

  try {
    const upstream = await fetch(target, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const isJson = contentType.includes("json");

    if (upstream.status >= 500) {
      return Response.json({ detail: "Backend error." }, { status: 502 });
    }

    if (!isJson) {
      return Response.json(
        { detail: "Unexpected backend response." },
        { status: upstream.status === 200 ? 502 : upstream.status },
      );
    }

    const headers = new Headers({ "cache-control": "no-store" });
    headers.set("content-type", contentType);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch {
    return Response.json({ detail: "Backend unavailable." }, { status: 502 });
  }
}
