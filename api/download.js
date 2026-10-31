const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";
const PRODUCT_ID = "1y8BSLIKyKyUf4gWd6_uAw==";

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

  return { ok: true, purchase };
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

  const releaseUrl = process.env.TEXTURE_OPS_RELEASE_URL;
  const releaseSha256 = process.env.TEXTURE_OPS_RELEASE_SHA256;
  const releaseVersion = process.env.TEXTURE_OPS_RELEASE_VERSION || "1.0.5";

  if (!releaseUrl || !releaseSha256) {
    return res.status(503).json({
      ok: false,
      error: "Update package is not configured on the server yet.",
    });
  }

  return res.status(200).json({
    ok: true,
    version: releaseVersion,
    download_url: releaseUrl,
    sha256: releaseSha256,
  });
}
