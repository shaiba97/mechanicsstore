import { NextRequest } from "next/server";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://mechanicsbackend.onrender.com";
const ALLOWED_RESOURCES = new Set([
  "login",
  "register",
  "refresh",
  "logout",
  "me",
  "providers",
  "google",
  "facebook",
]);
const POST_ONLY_PATHS = new Set(["login", "register", "refresh", "logout"]);
const REDIRECT_PATHS = new Set(["google", "facebook"]);
const SEGMENT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_BODY_LENGTH = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 10000;
const SESSION_COOKIE_NAME = "store_session";
const SESSION_COOKIE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

enum SessionAction {
  NONE = "none",
  SET = "set",
  CLEAR = "clear",
}

function jsonError(status: number, message: Record<string, unknown>): Response {
  return Response.json(message, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  if (path.length === 0 || path.length > 2) {
    return jsonError(404, { statusCode: 404, message: "Not found." });
  }
  if (!path.every((segment) => SEGMENT_PATTERN.test(segment))) {
    return jsonError(404, { statusCode: 404, message: "Not found." });
  }
  const resource = path[0];
  if (!ALLOWED_RESOURCES.has(resource)) {
    return jsonError(404, { statusCode: 404, message: "Not found." });
  }
  if (path.length === 2 && !(REDIRECT_PATHS.has(resource) && path[1] === "callback")) {
    return jsonError(404, { statusCode: 404, message: "Not found." });
  }

  const isPost = request.method === "POST";
  const isGet = request.method === "GET" || request.method === "HEAD";
  if (!isPost && !isGet) {
    return Response.json(
      { statusCode: 405, message: "Method not allowed." },
      { status: 405, headers: { allow: "GET, POST", "cache-control": "no-store" } },
    );
  }
  if (POST_ONLY_PATHS.has(resource) && !isPost) {
    return Response.json(
      { statusCode: 405, message: "Method not allowed." },
      { status: 405, headers: { allow: "POST", "cache-control": "no-store" } },
    );
  }
  if (!POST_ONLY_PATHS.has(resource) && isPost) {
    return Response.json(
      { statusCode: 405, message: "Method not allowed." },
      { status: 405, headers: { allow: "GET", "cache-control": "no-store" } },
    );
  }

  let body: string | undefined;
  let contentType = "application/json";
  if (isPost) {
    const raw = await request.text();
    if (raw.length > MAX_BODY_LENGTH) {
      return jsonError(413, { statusCode: 413, message: "Request body too large." });
    }
    if (raw.length > 0) {
      try {
        JSON.parse(raw);
      } catch {
        return jsonError(400, { statusCode: 400, message: "Invalid JSON body." });
      }
    }
    body = raw;
    const requestContentType = request.headers.get("content-type");
    if (requestContentType?.includes("json")) {
      contentType = requestContentType;
    }
  }

  const headers = new Headers({ accept: "application/json" });
  if (body !== undefined) {
    headers.set("content-type", contentType);
  }
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const target = new URL(`/auth/${path.map(encodeURIComponent).join("/")}`, BACKEND_BASE);
  target.search = new URL(request.url).search;

  let sessionAction = SessionAction.NONE;
  if (resource === "logout") {
    sessionAction = SessionAction.CLEAR;
  } else if (POST_ONLY_PATHS.has(resource)) {
    sessionAction = SessionAction.SET;
  }

  try {
    const upstream = await fetch(target, {
      method: isPost ? "POST" : "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers,
      body,
      cache: "no-store",
    });

    if (sessionAction !== SessionAction.NONE && upstream.status >= 300) {
      sessionAction = SessionAction.NONE;
    }

    const responseHeaders = new Headers({ "cache-control": "no-store" });
    const location = upstream.headers.get("location");
    if ((upstream.status === 301 || upstream.status === 302 || upstream.status === 303 || upstream.status === 307 || upstream.status === 308) && location) {
      responseHeaders.set("location", location);
      return new Response(null, { status: upstream.status, headers: responseHeaders });
    }

    const upstreamContentType = upstream.headers.get("content-type") ?? "";
    if (upstream.status >= 500) {
      return jsonError(502, { statusCode: 502, message: "Authentication service error." });
    }
    responseHeaders.set("content-type", upstreamContentType || "application/json");
    if (sessionAction === SessionAction.SET) {
      responseHeaders.set(
        "set-cookie",
        sessionCookie(),
      );
    } else if (sessionAction === SessionAction.CLEAR) {
      responseHeaders.set(
        "set-cookie",
        `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      );
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return jsonError(502, { statusCode: 502, message: "Authentication service unavailable." });
  }
}

function sessionCookie(): string {
  const expiresAt = Date.now() + SESSION_COOKIE_LIFETIME_MS;
  return `${SESSION_COOKIE_NAME}=${expiresAt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
    SESSION_COOKIE_LIFETIME_MS / 1000,
  )}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handler(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return handler(request, context);
}
