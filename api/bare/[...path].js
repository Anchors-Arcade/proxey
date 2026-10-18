// Bare server running as a Vercel Serverless Function (plain HTTP, no WebSockets needed).
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/api/bare/");

export default function handler(req, res) {
	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
	} else {
		res.statusCode = 404;
		res.end("Not found");
	}
}
