import config from "./index";

describe("runtime config", () => {
    // The session cookie is SameSite=Lax, so an API host that differs from the
    // page host (classically 127.0.0.1 vs localhost) is silently dropped by the
    // browser and every request fails with "Not authorized, no token".
    it("targets the same host the page was served from", () => {
        expect(new URL(config.apiUrl).hostname).toBe(window.location.hostname);
        expect(new URL(config.socketUrl).hostname).toBe(window.location.hostname);
    });

    it("keeps the /api prefix off the socket origin", () => {
        expect(config.apiUrl.endsWith("/api")).toBe(true);
        expect(config.socketUrl.endsWith("/api")).toBe(false);
    });
});
