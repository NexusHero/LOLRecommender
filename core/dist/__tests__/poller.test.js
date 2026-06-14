"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const poller_1 = require("../poller");
const fixtures_1 = require("./fixtures");
afterEach(() => {
    jest.useRealTimers();
});
describe("LiveClientPoller", () => {
    describe("start — initial poll", () => {
        it("start_ValidFetcherResponse_CallsOnDataWithParsedPayload", async () => {
            jest.useFakeTimers();
            const payload = (0, fixtures_1.makeRawGameData)();
            const onData = jest.fn();
            const fetcher = jest.fn().mockResolvedValue(payload);
            const poller = new poller_1.LiveClientPoller(onData, jest.fn(), fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0);
            poller.stop();
            expect(onData).toHaveBeenCalledWith(payload);
        });
        it("start_ValidFetcherResponse_CallsOnStatusChangeTrue", async () => {
            jest.useFakeTimers();
            const onStatusChange = jest.fn();
            const fetcher = jest.fn().mockResolvedValue((0, fixtures_1.makeRawGameData)());
            const poller = new poller_1.LiveClientPoller(jest.fn(), onStatusChange, fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0);
            poller.stop();
            expect(onStatusChange).toHaveBeenCalledWith(true);
        });
        it("start_InvalidFetcherResponse_DoesNotCallOnData", async () => {
            jest.useFakeTimers();
            const onData = jest.fn();
            const fetcher = jest.fn().mockResolvedValue({ invalid: true });
            const poller = new poller_1.LiveClientPoller(onData, jest.fn(), fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0);
            poller.stop();
            expect(onData).not.toHaveBeenCalled();
        });
        it("start_FetcherThrowsWithNoGameActive_DoesNotCallOnStatusChange", async () => {
            jest.useFakeTimers();
            const onStatusChange = jest.fn();
            const fetcher = jest.fn().mockRejectedValue(new Error("No game"));
            const poller = new poller_1.LiveClientPoller(jest.fn(), onStatusChange, fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0);
            poller.stop();
            expect(onStatusChange).not.toHaveBeenCalled();
        });
    });
    describe("start — interval polling", () => {
        it("start_AfterOneInterval_FetcherCalledAgain", async () => {
            jest.useFakeTimers();
            const fetcher = jest.fn().mockResolvedValue((0, fixtures_1.makeRawGameData)());
            const poller = new poller_1.LiveClientPoller(jest.fn(), jest.fn(), fetcher);
            poller.start();
            expect(fetcher).toHaveBeenCalledTimes(1);
            await jest.advanceTimersByTimeAsync(1000);
            expect(fetcher).toHaveBeenCalledTimes(2);
            poller.stop();
        });
        it("stop_Called_PreventsFurtherFetches", async () => {
            jest.useFakeTimers();
            const fetcher = jest.fn().mockResolvedValue((0, fixtures_1.makeRawGameData)());
            const poller = new poller_1.LiveClientPoller(jest.fn(), jest.fn(), fetcher);
            poller.start();
            poller.stop();
            const callsAtStop = fetcher.mock.calls.length;
            await jest.advanceTimersByTimeAsync(5000);
            expect(fetcher.mock.calls.length).toBe(callsAtStop);
        });
    });
    describe("game inactive transition", () => {
        it("poll_MaxConsecutiveFailures_CallsOnStatusChangeFalse", async () => {
            jest.useFakeTimers();
            const onStatusChange = jest.fn();
            const fetcher = jest.fn()
                .mockResolvedValueOnce((0, fixtures_1.makeRawGameData)())
                .mockRejectedValue(new Error("Connection refused"));
            const poller = new poller_1.LiveClientPoller(jest.fn(), onStatusChange, fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0); // flush initial poll — game becomes active
            // Advance through exactly MAX_POLL_FAILURES intervals
            for (let i = 0; i < poller_1.MAX_POLL_FAILURES; i++) {
                await jest.advanceTimersByTimeAsync(1000);
            }
            expect(onStatusChange).toHaveBeenCalledWith(false);
            poller.stop();
        });
        it("poll_FewerThanMaxConsecutiveFailures_DoesNotCallOnStatusChangeFalse", async () => {
            jest.useFakeTimers();
            const onStatusChange = jest.fn();
            const fetcher = jest.fn()
                .mockResolvedValueOnce((0, fixtures_1.makeRawGameData)())
                .mockRejectedValue(new Error("Connection refused"));
            const poller = new poller_1.LiveClientPoller(jest.fn(), onStatusChange, fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0);
            // One fewer than the threshold — should NOT flip to inactive
            for (let i = 0; i < poller_1.MAX_POLL_FAILURES - 1; i++) {
                await jest.advanceTimersByTimeAsync(1000);
            }
            expect(onStatusChange).not.toHaveBeenCalledWith(false);
            poller.stop();
        });
        it("poll_SingleTransientFailure_DoesNotCallOnStatusChangeFalse", async () => {
            jest.useFakeTimers();
            const onStatusChange = jest.fn();
            const fetcher = jest.fn()
                .mockResolvedValueOnce((0, fixtures_1.makeRawGameData)())
                .mockRejectedValueOnce(new Error("Transient error"))
                .mockResolvedValue((0, fixtures_1.makeRawGameData)());
            const poller = new poller_1.LiveClientPoller(jest.fn(), onStatusChange, fetcher);
            poller.start();
            await jest.advanceTimersByTimeAsync(0); // initial success
            await jest.advanceTimersByTimeAsync(1000); // failure
            await jest.advanceTimersByTimeAsync(1000); // recovery — counter resets
            expect(onStatusChange).not.toHaveBeenCalledWith(false);
            poller.stop();
        });
    });
});
describe("isLocalhostUrl", () => {
    it("isLocalhostUrl_127001_ReturnsTrue", () => {
        expect((0, poller_1.isLocalhostUrl)("https://127.0.0.1:2999/path")).toBe(true);
    });
    it("isLocalhostUrl_LocalhostHostname_ReturnsTrue", () => {
        expect((0, poller_1.isLocalhostUrl)("https://localhost:2999/path")).toBe(true);
    });
    it("isLocalhostUrl_RemoteHost_ReturnsFalse", () => {
        expect((0, poller_1.isLocalhostUrl)("https://example.com/path")).toBe(false);
    });
    it("isLocalhostUrl_InvalidUrl_ReturnsFalse", () => {
        expect((0, poller_1.isLocalhostUrl)("not-a-url")).toBe(false);
    });
    it("isLocalhostUrl_HttpLocalhost_ReturnsTrue", () => {
        expect((0, poller_1.isLocalhostUrl)("http://localhost:2999/path")).toBe(true);
    });
});
