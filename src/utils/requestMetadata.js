const parseUserAgent = (userAgent = "") => {
    const lower = userAgent.toLowerCase();

    let browser = "Unknown";
    if (lower.includes("edg/")) browser = "Edge";
    else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
    else if (lower.includes("chrome")) browser = "Chrome";
    else if (lower.includes("firefox")) browser = "Firefox";
    else if (lower.includes("safari")) browser = "Safari";

    let operatingSystem = "Unknown";
    if (lower.includes("android")) operatingSystem = "Android";
    else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) operatingSystem = "iOS";
    else if (lower.includes("windows")) operatingSystem = "Windows";
    else if (lower.includes("mac os") || lower.includes("macintosh")) operatingSystem = "macOS";
    else if (lower.includes("linux")) operatingSystem = "Linux";

    let deviceType = "Unknown";
    if (lower.includes("tablet") || lower.includes("ipad")) deviceType = "Tablet";
    else if (lower.includes("mobile") || lower.includes("android")) deviceType = "Mobile";
    else if (lower.includes("windows") || lower.includes("macintosh") || lower.includes("x11") || lower.includes("linux")) deviceType = "Desktop";

    return { browser, operating_system: operatingSystem, device_type: deviceType };
};

const getRequestMetadata = (req = {}) => {
    const userAgent = req.headers?.["user-agent"] || "";
    const metadata = parseUserAgent(userAgent);

    return {
        ip_address: req.ip || req.socket?.remoteAddress || null,
        user_agent: userAgent,
        ...metadata
    };
};

module.exports = {
    getRequestMetadata,
    parseUserAgent
};
