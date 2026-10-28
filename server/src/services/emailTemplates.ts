import { env } from '../config/env.js';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F6F7F9;font-family:Arial,Helvetica,sans-serif;color:#0F1B2D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:#0F1B2D;padding:20px 28px;color:#FFE8A3;font-size:20px;font-weight:bold;letter-spacing:.5px">${esc(env.MAIL_FROM_NAME)}</td></tr>
<tr><td style="border-top:3px dashed #C8242B;height:0;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px">${esc(title)}</h1>${bodyHtml}
${cta ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#C8242B;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>
<p style="font-size:12px;color:#5B6676;word-break:break-all">If the button does not work, paste this link into your browser:<br>${esc(cta.url)}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;background:#F6F7F9;font-size:12px;color:#5B6676">This is a demo project and is not affiliated with the IPL or BCCI. Tickets issued here are not valid for stadium entry.</td></tr>
</table></td></tr></table></body></html>`;
}

export function verifyEmailTemplate(name: string, url: string, hours: number) {
  return {
    subject: 'Verify your email address',
    html: layout(`Welcome, ${name}`, `<p>Confirm your email address to finish setting up your account. This link works for ${hours} hours.</p>`, { label: 'Verify email', url }),
    text: `Hi ${name},\n\nConfirm your email address: ${url}\nThis link works for ${hours} hours.\n`,
  };
}

export function resetPasswordTemplate(name: string, url: string, minutes: number) {
  return {
    subject: 'Reset your password',
    html: layout('Reset your password', `<p>Hi ${esc(name)}, we received a request to reset your password. This link works once and expires in ${minutes} minutes.</p><p>If you did not ask for this, you can ignore this email. Your password has not changed.</p>`, { label: 'Choose a new password', url }),
    text: `Hi ${name},\n\nReset your password: ${url}\nThis link works once and expires in ${minutes} minutes. If you did not request it, ignore this email.\n`,
  };
}

export function passwordChangedTemplate(name: string) {
  return {
    subject: 'Your password was changed',
    html: layout('Password changed', `<p>Hi ${esc(name)}, your password was just changed and all other devices were signed out.</p><p>If this was not you, reset your password immediately.</p>`),
    text: `Hi ${name},\n\nYour password was just changed and other devices were signed out. If this was not you, reset your password immediately.\n`,
  };
}
