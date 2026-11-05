# Login & Registration Config

> ⚠️ **CONFIGURE:** fill in this file with the configuration for your product
> and environment. Replace all `<placeholders>` with real values.
> After filling in — delete these ⚠️ CONFIGURE blocks.

## Login

- **URL:** `<login page URL>`
- **Email field:** `<how to find the email/username field — label, placeholder, or description>`
- **Password field:** `<how to find the password field — label, placeholder, or description>`
- **Login button:** `<text or description of the submit button>`
- **Credentials:**
  - `<Role 1, e.g. Admin>`: `<email or login>` / `<password>`
  - `<Role 2, e.g. User>`: `<email or login>` / `<password>`
  - `<Rule: which role to log in with by default and when to use another one>`
- **Success indicator:** `<what appears on the page after a successful login>`
- **After login:** `<optional: actions that must be performed right after login>`

## Registration

> ⚠️ **CONFIGURE:** fill in if the skill needs to register new users.
> If registration is not needed — delete this section.

- **URL:** `<registration page URL or link>`
- **Steps:**
  1. `<Step 1: description of the action and fields>`
  2. `<Step 2: description of the action and fields>`
  3. `<...>`
- **Success indicator:** `<what appears after a successful registration>`
- **After registration:** `<optional: actions after registration>`

## Default registration data

> ⚠️ **CONFIGURE:** specify the default test data for registering new
> users. Used when a test case needs a new user
> but does not specify concrete data.

- Email: `<email template for test users>`
- `<Field 2>`: `<default value>`
- `<Field 3>`: `<default value>`
- `<...>`

## Notes

> ⚠️ **CONFIGURE:** add notes specific to your product.
> Examples:
> - Which login methods are NOT supported by the agent (for example OAuth, SSO)
> - Which environment is used (dev / staging — not prod)
> - Specific limitations or behavior after login
