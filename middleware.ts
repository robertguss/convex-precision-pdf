import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { uploadLimiter } from "@/lib/rate-limit";

const isProtectedRoute = createRouteMatcher(["/server", "/dashboard(.*)"]);
const isPublicRoute = createRouteMatcher([
	"/",
	"/demo(.*)",
	"/api/examples(.*)",
]);
const isUploadRoute = createRouteMatcher([
	"/api/upload-document",
	"/api/upload-document-progressive",
]);

export default clerkMiddleware(async (auth, req) => {
	// Handle public routes
	if (isPublicRoute(req)) return;

	// Protect dashboard routes
	if (isProtectedRoute(req)) await auth.protect();

	// Handle rate limiting for upload routes
	if (isUploadRoute(req)) {
		const sessionAuth = await auth();
		const { userId } = sessionAuth;

		// For unauthenticated requests, use IP address as identifier
		const identifier =
			userId || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

		// Default to free plan limits
		let rateLimit = 10; // Free plan: 10 uploads per hour

		// Check if user has a paid subscription
		if (userId) {
			try {
				const token = await sessionAuth.getToken({ template: "convex" });
				if (token) {
					const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
					if (!convexUrl) {
						console.error("NEXT_PUBLIC_CONVEX_URL not configured");
						return;
					}
					const convex = new ConvexHttpClient(convexUrl);
					convex.setAuth(token);

					// Get user subscription
					const subscription = await convex.query(
						api.subscriptions.getUserSubscription,
					);

					// If user has an active paid subscription, increase rate limit
					if (subscription && subscription.status === "active") {
						rateLimit = 50; // Paid plan: 50 uploads per hour
					}
				}
			} catch (error) {
				console.error("Error checking subscription status:", error);
				// Continue with default rate limit on error
			}
		}

		// Check rate limit
		const { success, limit, reset, remaining } = await uploadLimiter.limit(
			identifier,
			{
				rate: rateLimit,
			},
		);

		// If rate limit exceeded, return error response
		if (!success) {
			return NextResponse.json(
				{
					error: "Rate limit exceeded",
					message: `You have exceeded the rate limit of ${rateLimit} uploads per hour. Please try again later.`,
				},
				{
					status: 429,
					headers: {
						"X-RateLimit-Limit": limit.toString(),
						"X-RateLimit-Remaining": remaining.toString(),
						"X-RateLimit-Reset": new Date(reset).toISOString(),
						"Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
					},
				},
			);
		}

		// Add rate limit headers to successful requests
		const response = NextResponse.next();
		response.headers.set("X-RateLimit-Limit", limit.toString());
		response.headers.set("X-RateLimit-Remaining", remaining.toString());
		response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());

		return response;
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
