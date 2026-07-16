export default async function ({ addon, console }) {
  const SCRATCH_CLOUD_HOST = "clouddata.scratch.mit.edu";
  const TURBOWARP_CLOUD_HOST = "clouddata.turbowarp.org";
  const RealWebSocket = window.WebSocket;

  console.log("Cloud-to-TurboWarp addon loaded. Patching WebSocket...");

  function PatchedWebSocket(url, protocols) {
    const originalUrl = url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === SCRATCH_CLOUD_HOST) {
        parsed.hostname = TURBOWARP_CLOUD_HOST;
        url = parsed.href;
        console.log(`Redirecting cloud connection: ${originalUrl} → ${url}`);
      }
    } catch (e) {
      // Invalid URL, pass through unchanged
    }
    const ws = protocols !== undefined ? new RealWebSocket(url, protocols) : new RealWebSocket(url);
    return ws;
  }

  PatchedWebSocket.prototype = RealWebSocket.prototype;
  for (const key of Object.getOwnPropertyNames(RealWebSocket)) {
    if (key !== "prototype" && key !== "length" && key !== "name") {
      try {
        PatchedWebSocket[key] = RealWebSocket[key];
      } catch (e) {}
    }
  }

  window.WebSocket = PatchedWebSocket;
  console.log("WebSocket patched. OPEN=" + window.WebSocket.OPEN);

  addon.self.addEventListener("disabled", () => {
    window.WebSocket = RealWebSocket;
    console.log("WebSocket restored to original.");
  });
  addon.self.addEventListener("reenabled", () => {
    window.WebSocket = PatchedWebSocket;
    console.log("WebSocket re-patched.");
  });
}
