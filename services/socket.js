import { io } from "socket.io-client";
import { getAuth, onIdTokenChanged } from "firebase/auth";

let socket = null;
let unsubscribeAuth = null;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "http://localhost:8080";

/**
 * Initialize the Socket.io client.
 * Call this once (e.g., in AuthContext useEffect). It will:
 * - Wait for Firebase Auth user
 * - Fetch ID token and connect
 * - Reconnect automatically when the token/user changes
 */
export function initSocket() {
  // already set up a watcher?
  if (unsubscribeAuth) return socket;

  const auth = getAuth(); // uses the default Firebase app you initialize in AuthContext

  unsubscribeAuth = onIdTokenChanged(auth, async (user) => {
    try {
      // No user -> close any existing socket
      if (!user) {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        return;
      }

      const token = await user.getIdToken(true);
      if (!token) return;

      // Reuse existing socket if present
      if (socket) {
        socket.auth = { token };
        if (socket.disconnected) socket.connect();
        return;
      }

      // Create new socket connection
      socket = io(WS_URL, {
        transports: ["websocket"],
        auth: { token },
        autoConnect: true,
      });

      // Optional logs
      socket.on("connect", () => console.log("[WS] connected", socket.id));
      socket.on("disconnect", (reason) => console.log("[WS] disconnected:", reason));
      socket.on("connect_error", (err) =>
        console.log("[WS] connect_error:", err?.message || err)
      );
    } catch (e) {
      console.log("[WS] token error:", e?.message || e);
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function cleanupSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
}

/** ---- Convenience wrappers ---- */

export function wsSendMessage(
  { conversationId, type, text = "", mediaUrl = null },
  cb
) {
  if (!socket) return cb?.({ ok: false, error: "Socket not ready" });
  socket.emit("message:send", { conversationId, type, text, mediaUrl }, cb);
}

export function wsTypingStart(conversationId) {
  if (!socket) return;
  socket.emit("typing:start", { conversationId });
}

export function wsTypingStop(conversationId) {
  if (!socket) return;
  socket.emit("typing:stop", { conversationId });
}

export function wsMarkSeen(conversationId, messageIds = [], cb) {
  if (!socket) return cb?.({ ok: false, error: "Socket not ready" });
  socket.emit("message:seen", { conversationId, messageIds }, cb);
}
