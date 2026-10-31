import { get } from "@vercel/blob";

const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";
const PRODUCT_ID = "1y8BSLIKyKyUf4gWd6_uAw==";

const RELEASE_VERSION = "1.0.6";
const RELEASE_PATHNAME = "releases/Texture_Ops_v1.0.6.zip";
const RELEASE_SHA256 = "451615a811cfde3bee35f147a684b504c534f94a6d52e151b5add62dc8786991";

async function verifyLicense(licenseKey) {
  const body = new URLSearchParams({
    product_id: PRODUCT_ID,
    license_key: licenseKey,
    increment_uses_count: "false",
  });

  const response = await fetch(GUMROAD_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    return { ok: false, reason: data?.message || "License verification failed." };
  }

  const purchase = data.purchase || {};
  if (purchase.refunded || purchase.disputed || purchase.chargebacked) {
    return { ok: false, reason: "License is no longer eligible for updates." };
  }
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "POST required." });
  }

  const licenseKey = String(req.body?.license_key || "").trim();
  if (!licenseKey) {
    return res.status(400).json({ ok: false, error: "Missing license key." });
  }

  const verified = await verifyLicense(licenseKey);
  if (!verified.ok) {
    return res.status(403).json({ ok: false, error: verified.reason });
  }

  const result = await get(RELEASE_PATHNAME, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return res.status(503).json({ ok: false, error: "Release package is not available yet." });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="Texture_Ops_v1.0.6.zip"');
  res.setHeader("X-Texture-Ops-Version", RELEASE_VERSION);
  res.setHeader("X-Texture-Ops-SHA256", RELEASE_SHA256);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  for await (const chunk of result.stream) {
    res.write(chunk);
  }
  res.end();
}
