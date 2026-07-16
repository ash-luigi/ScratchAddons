export default async function ({ addon, console }) {
  const SCRATCH_CLOUD_HOST = "clouddata.scratch.mit.edu";
  const TURBOWARP_CLOUD_HOST = "clouddata.turbowarp.org";
  const RealWebSocket = window.WebSocket;

  function PatchedWebSocket(url, protocols) {
    if (!(this instanceof PatchedWebSocket)) {
      return protocols !== undefined ? new RealWebSocket(url, protocols) : new RealWebSocket(url);
    }
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
    return protocols !== undefined ? new RealWebSocket(url, protocols) : new RealWebSocket(url);
  }

  PatchedWebSocket.prototype = RealWebSocket.prototype;
  PatchedWebSocket.prototype.constructor = PatchedWebSocket;
  Object.defineProperty(PatchedWebSocket, "name", { value: "WebSocket" });

  for (const key of Object.getOwnPropertyNames(RealWebSocket)) {
    if (key !== "prototype" && key !== "length" && key !== "name") {
      try {
        PatchedWebSocket[key] = RealWebSocket[key];
      } catch (e) {}
    }
  }

  window.WebSocket = PatchedWebSocket;

  addon.self.addEventListener("disabled", () => {
    window.WebSocket = RealWebSocket;
  });
  addon.self.addEventListener("reenabled", () => {
    window.WebSocket = PatchedWebSocket;
  });
}
