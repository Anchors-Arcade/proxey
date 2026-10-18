// Shared Bare server handler for Vercel (plain HTTP; no WebSockets on Vercel functions).
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/api/bare/");

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Expose-Headers": "*",
	"Access-Control-Max-Age": "7200",
};

function sendJson(res, status, obj) {
	for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(obj, null, 2));
}

// Make req.url look like /api/bare/<rest>/?<query> no matter how Vercel passed it.
function normalizeUrl(req) {
	const original = req.url || "";
	const qIndex = original.indexOf("?");
	const pathname = qIndex === -1 ? original : original.slice(0, qIndex);
	const search = qIndex === -1 ? "" : original.slice(qIndex);

	if (pathname.startsWith("/api/bare/")) return;
	if (pathname === "/api/bare") {
		req.url = "/api/bare/" + search;
		return;
	}

	// Vercel sometimes hands catch-all routes over as /api/bare/[...path]?path=v3
	const params = new URLSearchParams(search);
	const sub = params.getAll("path").join("/").replace(/^\/+|\/+$/g, "");
	params.delete("path");
	const rest = params.toString();
	req.url = "/api/bare/" + (sub ? sub + "/" : "") + (rest ? "?" + rest : "");
}

export default function handler(req, res) {
	const seenUrl = req.url;
	normalizeUrl(req);

	// Open /api/bare/v3/?debug=1 in a tab to confirm this function is deployed and see what it receives.
	if ((req.url || "").includes("debug=1") || (seenUrl || "").includes("debug=1")) {
		sendJson(res, 200, { ok: true, method: req.method, seenUrl, routedAs: req.url, shouldRoute: bare.shouldRoute(req) });
		return;
	}

	if (req.method === "OPTIONS") {
		for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
		const asked = req.headers["access-control-request-headers"];
		if (asked) res.setHeader("Access-Control-Allow-Headers", asked);
		res.statusCode = 204;
		res.end();
		return;
	}

	try {
		if (bare.shouldRoute(req)) {
			bare.routeRequest(req, res);
			return;
		}
	} catch (err) {
		sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
		return;
	}

	sendJson(res, 404, { error: "not a bare route", seenUrl, routedAs: req.url });
}
