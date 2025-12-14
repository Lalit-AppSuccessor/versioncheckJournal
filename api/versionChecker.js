import fetch from "node-fetch";

// === CONFIG ===
const PACKAGE_NAME = "com.journalit.notebook.diaryapp";
const CHAT_WEBHOOK =
  "https://chat.googleapis.com/v1/spaces/AAQASlHkdFk/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=spcAsy-lItg1uxHnA_U7WOHKupX9GoG_ZPat3v0pUmE";
const CURRENT_VERSION = "1.0.13"; // static base version

// === MAIN FUNCTION ===
export default async function handler(req, res) {
  try {
    const url = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}&hl=en&gl=US`;
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      console.error("❌ Play Store fetch failed:", response.status);
      return;
    }

    const html = await response.text();

    // === Step 1: Look for structured JSON with version info ===
    let version = null;

    // Pattern for embedded JSON (contains the version in nested arrays)
    const jsonMatch = html.match(/\[\[\["([\d.]+)"\]\],\[\[\[35\]\]/);
    if (jsonMatch && jsonMatch[1]) {
      version = jsonMatch[1].trim();
      console.log("🔍 Found version from structured data JSON:", version);
    }

    // Step 2: Fallback patterns if not found
    if (!version) {
      const regexes = [
        /"version":"([\d.]+)"/i,
        /Version[:\s"]+(\d+\.\d+\.\d+)/i,
        /Current\s*Version.*?<span[^>]*>([\d.]+)<\/span>/is,
      ];
      for (const r of regexes) {
        const m = html.match(r);
        if (m && m[1]) {
          version = m[1].trim();
          console.log(`🔍 Found version with fallback regex: ${r}`);
          break;
        }
      }
    }

    if (!version) {
      console.error("❌ Could not find version text in Play Store HTML");
      return;
    }

    console.log(`ℹ️ Play Store version found: ${version}`);

    if (version !== CURRENT_VERSION) {
      console.log(`🚀 New version detected: ${version}`);

      const payload = {
        text: `🚀 *Journal App Update!* Version *${version}* is now live on Play Store (previous: ${CURRENT_VERSION}).`,
      };

      await fetch(CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("✅ Notification sent to Google Chat");
      res.status(200).json({ status: "Ok" });
    } else {
      console.log(`✅ No update. Still version ${CURRENT_VERSION}`);
      res.status(404).json({ status: "no change found" });
    }
  } catch (err) {
    console.error("💥 Fatal error:", err);
    res.status(500).json({ error: "error" });
  }
}
