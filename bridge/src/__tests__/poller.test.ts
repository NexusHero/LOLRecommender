import { LiveClientPoller, MAX_POLL_FAILURES } from "../poller";
import { makeRawGameData } from "./fixtures";

afterEach(() => {
  jest.useRealTimers();
});

describe("LiveClientPoller", () => {
  describe("initial poll", () => {
    it("calls onData with valid parsed data", async () => {
      const payload = makeRawGameData();
      const onData = jest.fn();
      const fetcher = jest.fn().mockResolvedValue(payload);
      const poller = new LiveClientPoller(onData, jest.fn(), fetcher);

      poller.start();
      poller.stop();
      await Promise.resolve();
      await Promise.resolve();

      expect(onData).toHaveBeenCalledWith(payload);
    });

    it("calls onStatusChange(true) when game becomes active", async () => {
      const onStatusChange = jest.fn();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      poller.stop();
      await Promise.resolve();
      await Promise.resolve();

      expect(onStatusChange).toHaveBeenCalledWith(true);
    });

    it("does not call onData when fetcher returns invalid data", async () => {
      const onData = jest.fn();
      const fetcher = jest.fn().mockResolvedValue({ invalid: true });
      const poller = new LiveClientPoller(onData, jest.fn(), fetcher);

      poller.start();
      poller.stop();
      await Promise.resolve();
      await Promise.resolve();

      expect(onData).not.toHaveBeenCalled();
    });

    it("does not call onStatusChange when game was never active and fetcher throws", async () => {
      const onStatusChange = jest.fn();
      const fetcher = jest.fn().mockRejectedValue(new Error("No game"));
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      poller.stop();
      await Promise.resolve();
      await Promise.resolve();

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("interval polling", () => {
    it("polls again after the configured interval", () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), jest.fn(), fetcher);

      poller.start();
      expect(fetcher).toHaveBeenCalledTimes(1); // initial call

      jest.advanceTimersByTime(1000);
      expect(fetcher).toHaveBeenCalledTimes(2); // after 1 interval

      poller.stop();
    });

    it("stop prevents further polling", () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), jest.fn(), fetcher);

      poller.start();
      poller.stop();
      const callsAtStop = fetcher.mock.calls.length;

      jest.advanceTimersByTime(5000);

      expect(fetcher.mock.calls.length).toBe(callsAtStop);
    });
  });

  describe("game inactive transition", () => {
    it(`calls onStatusChange(false) only after ${MAX_POLL_FAILURES} consecutive failures`, async () => {
      const onStatusChange = jest.fn();
      const fetcher = jest.fn()
        .mockResolvedValueOnce(makeRawGameData())
        .mockRejectedValue(new Error("Connection refused"));
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      poller.stop();
      // Let first poll complete (activates game)
      await Promise.resolve();
      await Promise.resolve();

      // Trigger failures up to (but not including) the threshold — should NOT fire false yet
      for (let i = 0; i < MAX_POLL_FAILURES - 1; i++) {
        (poller as any).poll();
        await Promise.resolve();
        await Promise.resolve();
      }
      expect(onStatusChange).not.toHaveBeenCalledWith(false);

      // Final failure crosses the threshold — now fires
      (poller as any).poll();
      await Promise.resolve();
      await Promise.resolve();

      expect(onStatusChange).toHaveBeenCalledWith(false);
    });

    it("does not call onStatusChange(false) for a single transient failure", async () => {
      const onStatusChange = jest.fn();
      const fetcher = jest.fn()
        .mockResolvedValueOnce(makeRawGameData())
        .mockRejectedValueOnce(new Error("Transient error"))
        .mockResolvedValue(makeRawGameData());
      const poller = new LiveClientPoller(jest.fn(), onStatusChange, fetcher);

      poller.start();
      poller.stop();
      await Promise.resolve();
      await Promise.resolve();

      // One failure followed by a success — counter resets, no GAME_INACTIVE fired
      (poller as any).poll();
      await Promise.resolve();
      await Promise.resolve();
      (poller as any).poll();
      await Promise.resolve();
      await Promise.resolve();

      expect(onStatusChange).not.toHaveBeenCalledWith(false);
    });
  });
});
