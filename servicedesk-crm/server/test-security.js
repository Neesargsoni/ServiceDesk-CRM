const BASE_URL = "http://localhost:5001";

async function testSecurity() {
    console.log("🛡️  Starting Security Verification...\n");

    try {
        // We hit the health check or root API
        const res = await fetch(`${BASE_URL}/api`);

        console.log("---------------------------------------------------");
        console.log("🔍  INSPECTING HTTP HEADERS");
        console.log("---------------------------------------------------");

        // 1. HELMET CHECK: X-Powered-By should be hidden
        const xPoweredBy = res.headers.get("x-powered-by");
        if (!xPoweredBy) {
            console.log("✅ [Helmet] 'X-Powered-By' header is HIDDEN (Good! attackers won't know we use Express)");
        } else {
            console.error("❌ [Helmet] 'X-Powered-By' is VISIBLE:", xPoweredBy);
        }

        // 2. HELMET CHECK: Strict-Transport-Security (HSTS)
        // Note: HSTS might not be set by default Helmet on http localhost, but DNSPrefetchControl etc usually are.
        const dnsPrefetch = res.headers.get("x-dns-prefetch-control");
        if (dnsPrefetch === 'off') {
            console.log("✅ [Helmet] 'X-DNS-Prefetch-Control' is set to OFF (Prevents data leakage)");
        }

        // 3. RATE LIMITING CHECK
        // We enabled standardHeaders: true, so we should see RateLimit headers
        const rateLimitLimit = res.headers.get("ratelimit-limit");
        const rateLimitRemaining = res.headers.get("ratelimit-remaining");

        if (rateLimitLimit) {
            console.log(`✅ [RateLimit] Rate Limiting is ACTIVE`);
            console.log(`   - Limit: ${rateLimitLimit} requests`);
            console.log(`   - Remaining: ${rateLimitRemaining} requests`);
        } else {
            console.error("❌ [RateLimit] Rate Limit headers are MISSING.");
        }

        console.log("\n---------------------------------------------------");
        console.log("🎉  SECURITY CHECK COMPLETE");
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("❌ Error connecting to server:", error.message);
        console.log("   (Make sure 'node app.js' or 'npm run dev' is running in the server folder)");
    }
}

testSecurity();
