import { LiveClientPoller, MAX_POLL_FAILURES } from "../poller";
import { makeRawGameData } from "./fixtures";

afterEach(() => {
  jest.useRealTimers();
});

describe("LiveClientPoller", () => {
  describe("start — initial poll", () => {
    it("start_ValidFetcherResponse_CallsOnDataWithParsedPayload", async () => {
      jest.useFakeTimers();
      const payload = makeRawGameData();
      const onData = jest.fn();
      const fetcher = jest.fn().mockResolvedValue(payload);
      const poller = new LiveClientPoller(onData, jest.fn(), fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0);
      poller.stop();

      expect(onData).toHaveBeenCalledWith(payload);
    });

    it("start_ValidFetcherResponse_CallsOnStatusChangeTrue", async () => {
      jest.useFakeTimers();
      const onStatusChange = jest.fn();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0);
      poller.stop();

      expect(onStatusChange).toHaveBeenCalledWith(true);
    });

    it("start_InvalidFetcherResponse_DoesNotCallOnData", async () => {
      jest.useFakeTimers();
      const onData = jest.fn();
      const fetcher = jest.fn().mockResolvedValue({ invalid: true });
      const poller = new LiveClientPoller(onData, jest.fn(), fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0);
      poller.stop();

      expect(onData).not.toHaveBeenCalled();
    });

    it("start_FetcherThrowsWithNoGameActive_DoesNotCallOnStatusChange", async () => {
      jest.useFakeTimers();
      const onStatusChange = jest.fn();
      const fetcher = jest.fn().mockRejectedValue(new Error("No game"));
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0);
      poller.stop();

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("start — interval polling", () => {
    it("start_AfterOneInterval_FetcherCalledAgain", async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), jest.fn(), fetcher);

      poller.start();
      expect(fetcher).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      expect(fetcher).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    it("stop_Called_PreventsFurtherFetches", async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), jest.fn(), fetcher);

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
        .mockResolvedValueOnce(makeRawGameData())
        .mockRejectedValue(new Error("Connection refused"));
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0); // flush initial poll — game becomes active

      // Advance through exactly MAX_POLL_FAILURES intervals
      for (let i = 0; i < MAX_POLL_FAILURES; i++) {
        await jest.advanceTimersByTimeAsync(1000);
      }

      expect(onStatusChange).toHaveBeenCalledWith(false);
      poller.stop();
    });

    it("poll_FewerThanMaxConsecutiveFailures_DoesNotCallOnStatusChangeFalse", async () => {
      jest.useFakeTimers();
      const onStatusChange = jest.fn();
      const fetcher = jest.fn()
        .mockResolvedValueOnce(makeRawGameData())
        .mockRejectedValue(new Error("Connection refused"));
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0);

      // One fewer than the threshold — should NOT flip to inactive
      for (let i = 0; i < MAX_POLL_FAILURES - 1; i++) {
        await jest.advanceTimersByTimeAsync(1000);
      }

      expect(onStatusChange).not.toHaveBeenCalledWith(false);
      poller.stop();
    });

    it("poll_SingleTransientFailure_DoesNotCallOnStatusChangeFalse", async () => {
      jest.useFakeTimers();
      const onStatusChange = jest.fn();
      const fetcher = jest.fn()
        .mockResolvedValueOnce(makeRawGameData())
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      await jest.advanceTimersByTimeAsync(0); // initial success
      await jest.advanceTimersByTimeAsync(1000); // failure
      await jest.advanceTimersByTimeAsync(1000); // recovery — counter resets

      expect(onStatusChange).not.toHaveBeenCalledWith(false);
      poller.stop();
    });
  });
});
