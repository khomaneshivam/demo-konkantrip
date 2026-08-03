const db = require('../config/db');

const parseUserAgent = (userAgent = '') => {
  const ua = userAgent || '';
  const lower = ua.toLowerCase();

  let browser = 'Unknown';
  if (lower.includes('chrome')) browser = 'Chrome';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('safari')) browser = 'Safari';
  else if (lower.includes('edge')) browser = 'Edge';
  else if (lower.includes('opera')) browser = 'Opera';

  let operatingSystem = 'Unknown';
  if (lower.includes('windows')) operatingSystem = 'Windows';
  else if (lower.includes('mac os')) operatingSystem = 'macOS';
  else if (lower.includes('linux')) operatingSystem = 'Linux';
  else if (lower.includes('android')) operatingSystem = 'Android';
  else if (lower.includes('ios')) operatingSystem = 'iOS';

  let deviceType = 'Unknown';
  if (lower.includes('mobile')) deviceType = 'Mobile';
  else if (lower.includes('tablet')) deviceType = 'Tablet';
  else if (lower.includes('windows') || lower.includes('macintosh') || lower.includes('x11')) deviceType = 'Desktop';

  return { browser, operating_system: operatingSystem, device_type: deviceType };
};

const buildLoginLogPayload = (req, { p_owner_id, email, loginStatus, failureReason, sessionId, jwtId }) => {
  const userAgent = req?.headers?.['user-agent'] || req?.headers?.['User-Agent'] || '';
  const { browser, operating_system, device_type } = parseUserAgent(userAgent);

  return {
    p_owner_id,
    email,
    login_status: loginStatus,
    failure_reason: failureReason || null,
    ip_address: req?.ip || req?.socket?.remoteAddress || null,
    user_agent: userAgent,
    device_type,
    browser,
    operating_system,
    session_id: sessionId || null,
    jwt_id: jwtId || null
  };
};

const insertLoginLog = async (req, data) => {
  const payload = buildLoginLogPayload(req, data);

  await db.query(
    `INSERT INTO property_owner_login_logs (
      p_owner_id,
      email,
      login_status,
      failure_reason,
      ip_address,
      user_agent,
      device_type,
      browser,
      operating_system,
      session_id,
      jwt_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.p_owner_id || null,
      payload.email || null,
      payload.login_status,
      payload.failure_reason,
      payload.ip_address,
      payload.user_agent,
      payload.device_type,
      payload.browser,
      payload.operating_system,
      payload.session_id,
      payload.jwt_id
    ]
  );
};

const getPropertyOwnerLoginLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM property_owner_login_logs ORDER BY created_at DESC, id DESC'
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property owner login logs'
    });
  }
};

module.exports = {
  buildLoginLogPayload,
  insertLoginLog,
  getPropertyOwnerLoginLogs
};
