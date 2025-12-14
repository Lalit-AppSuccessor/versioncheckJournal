import fetch from "node-fetch";

// === CONFIG ===
const PACKAGE_NAME = "com.journalit.notebook.diaryapp";
const CHAT_WEBHOOK =
  "https://chat.googleapis.com/v1/spaces/AAQAJe9l_mk/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=kkMVUo3_6QtXzFRxcsuqeaaPrHVrulhwBcuUdzGQE0Q";

const CURRENT_VERSION = "1.0.12"; // static base version

export default async function handler(req, res) {
  try {
    const url = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}&hl=en&gl=US`;
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      console.error("❌ Play Store fetch failed:", response.status);
      return res
        .status(500)
        .json({ error: `Play Store fetch failed: ${response.status}` });
    }

    const html = await response.text();
    const match = html.match(/Current Version.*?<span[^>]*>([\d.]+)<\/span>/s);
    const version = match ? match[1].trim() : null;

    if (!version) {
      console.error("❌ Could not find version text in Play Store HTML");
      return res
        .status(500)
        .json({ error: "Could not find version in Play Store HTML" });
    }

    console.log(`ℹ️ Play Store version found: ${version}`);

    if (version !== CURRENT_VERSION) {
      console.log(`🚀 New version detected: ${version}`);
      await fetch(CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚀 *Journal App Update!* Version *${version}* is now live on Play Store (previous: ${CURRENT_VERSION}).`,
        }),
      });
      console.log("✅ Notification sent to Google Chat");
    } else {
      console.log(`✅ No update. Still version ${CURRENT_VERSION}`);
    }

    return res.status(200).json({
      playstoreVersion: version,
      currentVersion: CURRENT_VERSION,
      updated: version !== CURRENT_VERSION,
    });
  } catch (err) {
    console.error("💥 Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
