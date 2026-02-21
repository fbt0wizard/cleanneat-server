# Mail / SMTP environment variables

When creating a user via **POST /api/v1/users**, the API can send the new user their **email** and **password** by email. Mail is optional: if these variables are not set, user creation still succeeds but no email is sent.

## Required for sending mail

| Variable      | Description |
|---------------|-------------|
| `SMTP_HOST`   | SMTP server hostname (e.g. `smtp.gmail.com`, `smtp.sendgrid.net`). |
| `MAIL_FROM`   | Sender email address (e.g. `noreply@yourdomain.com`). Must be a valid email. |

## Optional

| Variable        | Description | Default |
|-----------------|-------------|---------|
| `SMTP_PORT`     | SMTP port. | `587` |
| `SMTP_SECURE`   | Use TLS. Set to `true` or `1` for port 465. | `false` |
| `SMTP_USER`     | SMTP username (if your provider requires auth). | — |
| `SMTP_PASS`     | SMTP password (if your provider requires auth). | — |
| `MAIL_FROM_NAME`| Display name for the sender (e.g. `Clean Neat`). | `Clean Neat` |

## Example

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_FROM_NAME=Clean Neat
```

## Templates

Email body is rendered from **Handlebars** templates under `templates/emails/`:

- `user-credentials.hbs` – Sent when a new user is created; receives `name`, `email`, `password`.

Run the app from the project root so `templates/emails/` is found. For production, keep the `templates` folder next to your deployed app (or set the working directory to the project root).
