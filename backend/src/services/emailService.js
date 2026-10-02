"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isEmailConfigured = isEmailConfigured;
exports.sendCloudflareEmail = sendCloudflareEmail;
exports.sendOtpEmail = sendOtpEmail;
var _env = require("../config/env");
// import { HttpError } from '../utils/errors';

function isEmailConfigured() {
  return Boolean(_env.env.cloudflareAccountId && _env.env.cloudflareApiToken && _env.env.mailFromEmail);
}
function escapeHtml(unsafe) {
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
async function sendCloudflareEmail({
  to,
  subject,
  text,
  html
}) {
  if (typeof fetch !== 'function') {
    throw new Error('Email sending requires Node.js 18+ fetch support');
  }
  let response;
  try {
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${_env.env.cloudflareAccountId}/email/sending/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${_env.env.cloudflareApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        from: _env.env.mailFromEmail,
        subject,
        text,
        html
      })
    });
  } catch (error) {
    console.error('[email] Cloudflare request failed', {
      to,
      message: error.message,
      cause: error.cause?.message || error.cause
    });
    throw error;
  }
  const responseBody = await response.text();
  let payload;
  try {
    payload = responseBody ? JSON.parse(responseBody) : {};
  } catch (_error) {
    payload = {
      rawResponse: responseBody
    };
  }
  const logDetails = {
    to,
    status: response.status,
    statusText: response.statusText,
    payload
  };
  if (!response.ok || payload.success === false) {
    console.error('[email] Cloudflare delivery failed', logDetails);
    const message = payload.errors?.[0]?.message || 'Cloudflare email delivery failed';
    throw new Error(message);
  }
  console.log('[email] Cloudflare delivery response', logDetails);
  return payload.result;
}
async function sendOtpEmail({
  to,
  code,
  expiresInMinutes = 10
}) {
  if (!isEmailConfigured()) {
    if (_env.env.NODE_ENV === 'production') {
      throw new Error('Cloudflare email sending is not configured');
    }
    console.log(`[Dev] Sending OTP ${code} to ${to}`);
    return {
      skipped: true
    };
  }
  const safeCode = escapeHtml(code);
  const safeMinutes = escapeHtml(expiresInMinutes);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Your Safer Signal verification code</title>
  </head>
  <body style="margin:0;background:#f5f8fc;font-family:Inter,Arial,sans-serif;color:#111f34;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Use ${safeCode} to verify your Safer Signal account. This code expires in ${safeMinutes} minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fc;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dfe6f0;border-radius:18px;overflow:hidden;box-shadow: 0 22px 70px rgba(34,63,106,.13);">
            <tr>
              <td style="padding:28px 28px 18px;">
                <p style="margin:0 0 18px;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0b5cff;">
                  Safer Signal
                </p>
                <h1 style="margin:0;color:#111f34;font-size:24px;line-height:1.25;font-weight:800;">
                  Verify your email
                </h1>
                <p style="margin:12px 0 0;color:#697990;font-size:15px;line-height:1.6;">
                  Enter this code in the Safer Signal app to continue. For your security, it expires in ${safeMinutes} minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 28px 26px;">
                <div style="background:#eaf2ff;border:1px solid #c2dbff;border-radius:14px;padding:20px;text-align:center;">
                  <p style="margin:0 0 10px;color:#697990;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                    Verification code
                  </p>
                  <p style="margin:0;color:#0b5cff;font-size:34px;line-height:1;font-weight:800;letter-spacing:0.22em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;">
                    ${safeCode}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;color:#8190a4;font-size:13px;line-height:1.6;">
                  If you did not request this code, you can safely ignore this email. Do not share this code with anyone.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#8190a4;font-size:12px;line-height:1.5;">
            Sent by Safer intelligence Technologies
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return sendCloudflareEmail({
    to,
    subject: 'Your Safer Signal verification code',
    text: `Your Safer Signal verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    html
  });
}
