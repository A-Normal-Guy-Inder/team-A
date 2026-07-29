import config from "./index";

describe("runtime config", () => {
    it("targets the same host the page was served from", () => {
        expect(new URL(config.apiUrl).hostname).toBe(window.location.hostname);
        expect(new URL(config.socketUrl).hostname).toBe(window.location.hostname);
    });

    it("keeps the /api prefix off the socket origin", () => {
        expect(config.apiUrl.endsWith("/api")).toBe(true);
        expect(config.socketUrl.endsWith("/api")).toBe(false);
    });
});
