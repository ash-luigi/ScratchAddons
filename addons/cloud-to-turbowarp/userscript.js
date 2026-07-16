export default async function ({ addon, console }) {
  const SCRATCH_CLOUD_HOST = "clouddata.scratch.mit.edu";
  const TURBOWARP_CLOUD_HOST = "clouddata.turbowarp.org";
  const RealWebSocket = window.WebSocket;

  function PatchedWebSocket(url, protocols) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === SCRATCH_CLOUD_HOST) {
        parsed.hostname = TURBOWARP_CLOUD_HOST;
        console.log(`Redirecting cloud connection: ${url} → ${parsed.href}`);
        url = parsed.href;
      }
    } catch (e) {
      // Invalid URL, pass through unchanged
    }
    if (protocols !== undefined) {
      return new RealWebSocket(url, protocols);
    }
    return new RealWebSocket(url);
  }

  PatchedWebSocket.prototype = RealWebSocket.prototype;
  PatchedWebSocket.prototype.constructor = PatchedWebSocket;
  window.WebSocket = PatchedWebSocket;

  addon.self.addEventListener("disabled", () => {
    window.WebSocket = RealWebSocket;
  });
  addon.self.addEventListener("reenabled", () => {
    window.WebSocket = PatchedWebSocket;
  });
}
