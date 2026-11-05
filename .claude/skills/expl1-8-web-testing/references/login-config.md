# App settings for web testing (optional)

The user logs in themselves in the headed browser window (see `browser-rules.md`,
"Login (human-assisted)"), so credentials are NOT required here.
Fill in the fields below only to save the agent a question. Empty fields are fine —
the agent asks the user when it needs a value.

## App

- **Base URL:** (not set — the agent asks the user)
- **Login URL:** (not set — the user opens/logs in themselves)
- **Login:** manual — the user logs in in the open browser window
- **Success indicator:** (for example "the inventory page is shown")
- **Agent may type credentials:** no

## Notes

- Environment: (dev / staging — not prod)
- Login methods the agent must not handle (OAuth, SSO, 2FA, captcha): the user does them.
