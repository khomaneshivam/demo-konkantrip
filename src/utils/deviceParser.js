/**
 * Utility to extract browser, OS, and device type from User-Agent string
 */
function parseUserAgent(userAgentString = "") {
    const ua = String(userAgentString || "");

    let browser = "Other";
    let os = "Other";
    let deviceType = "Desktop";

    // Detect Device Type
    if (/mobile/i.test(ua)) {
        deviceType = "Mobile";
    } else if (/tablet|ipad/i.test(ua)) {
        deviceType = "Tablet";
    } else {
        deviceType = "Desktop";
    }

    // Detect OS
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";

    // Detect Browser
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/opr|opera/i.test(ua)) browser = "Opera";

    return { browser, os, deviceType };
}

module.exports = { parseUserAgent };
