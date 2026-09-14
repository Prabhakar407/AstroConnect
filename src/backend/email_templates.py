"""Email-safe Astro Advice presentation shared by transactional messages."""

import html
from urllib.parse import urlsplit

from .domain import CLIENT_PHONE

BRAND_NAME = "Astro Advice by Kundan Singh"
SITE_URL = "https://astroadvicebykundansingh.com"


def _clean(value):
    return str(value or "").strip()


def display_phone(value=CLIENT_PHONE):
    """Present the fixed Indian studio number in a readable form."""
    digits = ''.join(character for character in _clean(value) if character.isdigit())
    if len(digits) == 12 and digits.startswith('91'):
        return f'+91 {digits[2:7]} {digits[7:]}'
    return _clean(value)


def _text_sections(sections):
    parts = []
    for section in sections:
        heading = _clean(section.get("heading"))
        rows = [(str(label), _clean(value)) for label, value in section.get("rows", ()) if _clean(value)]
        if heading:
            parts.append(heading)
        parts.extend(f"{label}: {value}" for label, value in rows)
    return parts


def message(*, sender, recipient, reply_to, subject, preheader, title, introduction,
            sections, action=None, notice=None):
    """Build one responsive, branded HTML email plus an equivalent text copy.

    Sections and actions are structured data so every user-controlled value is
    escaped at this final rendering boundary.
    """
    if any("\r" in value or "\n" in value for value in (sender, recipient, reply_to, subject)):
        raise ValueError("Email headers cannot contain line breaks.")
    action_label = action_url = None
    if action:
        action_label, action_url = map(_clean, action)
        parsed = urlsplit(action_url)
        if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.fragment:
            raise ValueError("Email actions require a safe HTTPS destination.")

    text_parts = [title, introduction, *_text_sections(sections)]
    if action_label:
        text_parts.extend((action_label, action_url))
    if notice:
        text_parts.append(_clean(notice))
    phone = display_phone()
    text_parts.extend((f"Need help? Call {phone}.", BRAND_NAME, SITE_URL))
    text = "\n\n".join(part for part in map(_clean, text_parts) if part)

    section_html = []
    for section in sections:
        heading = _clean(section.get("heading"))
        rows = [(str(label), _clean(value)) for label, value in section.get("rows", ()) if _clean(value)]
        if not heading and not rows:
            continue
        row_html = "".join(
            '<tr><td style="padding:10px 0;border-bottom:1px solid #e7deca;vertical-align:top;'
            'width:38%;font-size:13px;line-height:1.45;color:#756753;font-weight:600;">'
            f'{html.escape(label)}</td><td style="padding:10px 0 10px 16px;border-bottom:1px solid #e7deca;'
            'vertical-align:top;font-size:15px;line-height:1.5;color:#181122;font-weight:500;'
            'overflow-wrap:anywhere;">'
            f'{html.escape(value)}</td></tr>' for label, value in rows)
        section_html.append(
            '<div style="margin:0 0 24px;">'
            + (f'<h2 style="margin:0 0 8px;font-family:Georgia,Times New Roman,serif;font-size:20px;'
               f'line-height:1.3;font-weight:600;color:#181122;">{html.escape(heading)}</h2>' if heading else "")
            + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
              'style="width:100%;border-collapse:collapse;">'
            + row_html + '</table></div>')

    action_html = ""
    if action_label:
        action_html = (
            '<div style="margin:4px 0 26px;">'
            f'<a href="{html.escape(action_url, quote=True)}" style="display:inline-block;background:#d3af54;'
            'color:#181122;text-decoration:none;font-size:16px;line-height:1.2;font-weight:700;'
            'padding:13px 22px;border-radius:8px;">'
            f'{html.escape(action_label)}</a></div>')

    notice_html = ""
    if notice:
        notice_html = (
            '<div style="margin:4px 0 24px;padding:14px 16px;background:#f5ecda;border-radius:10px;'
            'color:#4b3d2c;font-size:14px;line-height:1.55;">'
            f'{html.escape(_clean(notice))}</div>')

    email_html = (
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">'
        '<title>' + html.escape(subject) + '</title></head>'
        '<body style="margin:0;padding:0;background:#ede9d7;color:#181122;">'
        '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">'
        + html.escape(preheader) + '</div>'
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
        'style="width:100%;border-collapse:collapse;background:#ede9d7;">'
        '<tr><td align="center" style="padding:28px 14px;">'
        '<table role="presentation" width="620" cellspacing="0" cellpadding="0" '
        'style="width:100%;max-width:620px;border-collapse:separate;background:#fffdf7;border-radius:14px;'
        'overflow:hidden;box-shadow:0 14px 34px -24px rgba(24,17,34,.55);">'
        '<tr><td style="padding:22px 30px;background:#181122;">'
        '<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.3;letter-spacing:1.7px;'
        'text-transform:uppercase;color:#e3c66e;font-weight:700;">Astro Advice</div>'
        '<div style="margin-top:4px;font-family:Georgia,Times New Roman,serif;font-size:24px;line-height:1.25;'
        'color:#fffaf0;font-weight:600;">Kundan Singh</div></td></tr>'
        '<tr><td style="padding:34px 30px 30px;font-family:Arial,Helvetica,sans-serif;">'
        f'<h1 style="margin:0 0 12px;font-family:Georgia,Times New Roman,serif;font-size:30px;line-height:1.2;'
        f'font-weight:600;color:#181122;letter-spacing:-.3px;">{html.escape(_clean(title))}</h1>'
        f'<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#584b53;">'
        f'{html.escape(_clean(introduction))}</p>'
        + ''.join(section_html) + action_html + notice_html
        + '<p style="margin:0;font-size:14px;line-height:1.6;color:#584b53;">Need help? Call '
          f'<a href="tel:{html.escape(CLIENT_PHONE.replace(" ", ""), quote=True)}" '
          'style="color:#745713;font-weight:700;text-decoration:none;">'
          f'{html.escape(phone)}</a>.</p></td></tr>'
        '<tr><td style="padding:18px 30px;background:#f7f1e3;font-family:Arial,Helvetica,sans-serif;'
        'font-size:12px;line-height:1.55;color:#756753;">'
        f'{html.escape(BRAND_NAME)}<br><a href="{SITE_URL}" style="color:#745713;text-decoration:none;">'
        f'{SITE_URL.removeprefix("https://")}</a></td></tr>'
        '</table></td></tr></table></body></html>')

    return {"from": sender, "to": [recipient], "reply_to": reply_to, "subject": subject,
            "text": text, "html": email_html}
