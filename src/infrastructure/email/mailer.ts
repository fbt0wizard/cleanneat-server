import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import type { ApplicationConfig } from '../config';
import type pino from 'pino';

export type MailConfig = NonNullable<ApplicationConfig['mail']>;

export interface Mailer {
  sendUserCredentials(to: string, name: string, email: string, password: string): Promise<void>;
}

function getTemplatesDir(): string {
  return path.join(process.cwd(), 'templates', 'emails');
}

function loadTemplate(name: string): Handlebars.TemplateDelegate {
  const dir = getTemplatesDir();
  const filePath = path.join(dir, `${name}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8');
  return Handlebars.compile(source);
}

export function makeMailer(config: ApplicationConfig, logger: pino.Logger): Mailer {
  const mail = config.mail;

  if (!mail) {
    logger.info('Mail not configured (SMTP_HOST/MAIL_FROM missing); credential emails disabled');
    return {
      async sendUserCredentials() {
        // no-op
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.secure,
    auth:
      mail.user && mail.pass
        ? { user: mail.user, pass: mail.pass }
        : undefined,
  });

  let template: Handlebars.TemplateDelegate | null = null;

  function getCredentialsTemplate(): Handlebars.TemplateDelegate {
    template ??= loadTemplate('user-credentials');
    return template;
  }

  return {
    async sendUserCredentials(to: string, name: string, email: string, password: string) {
      try {
        const html = getCredentialsTemplate()({
          name,
          email,
          password,
        });

        await transporter.sendMail({
          from: mail.fromName ? `"${mail.fromName}" <${mail.from}>` : mail.from,
          to,
          subject: 'Your account credentials',
          html,
        });
        logger.info({ to }, 'Credentials email sent');
      } catch (err) {
        logger.warn({ err, to }, 'Failed to send credentials email');
        // Don't throw – user is already created; email failure is non-fatal
      }
    },
  };
}
