// Shared Bare server handler for Vercel (plain HTTP; no WebSockets on Vercel functions).
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/api/bare/");

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "*",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Expose-Headers": "*",
};

export default function handler(req, res) {
	// Treat /api/bare (no trailing slash) like /api/bare/
	const [path, query] = req.url.split("?");
	if (path === "/api/bare") req.url = "/api/bare/" + (query ? "?" + query : "");

	if (req.method === "OPTIONS") {
		for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
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
		for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
		res.statusCode = 500;
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
		return;
	}

	for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
	res.statusCode = 404;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ error: "not a bare route", url: req.url }));
}
