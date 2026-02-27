import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import { MailtrapClient } from 'mailtrap';
import nodemailer from 'nodemailer';
import type pino from 'pino';
import type { ApplicationConfig } from '../config';

export type MailConfig = NonNullable<ApplicationConfig['mail']>;

export interface Mailer {
  sendUserCredentials(to: string, name: string, email: string, password: string): Promise<void>;
  sendInquiryConfirmation(to: string, fullName: string, inquiryId: string): Promise<void>;
  sendApplicationConfirmation(to: string, fullName: string, applicationId: string): Promise<void>;
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
    logger.info('Mail not configured (MAIL_FROM + MAILTRAP_API_KEY or SMTP_HOST missing); emails disabled');
    return {
      async sendUserCredentials() {
        // no-op
      },
      async sendInquiryConfirmation() {
        // no-op
      },
      async sendApplicationConfirmation() {
        // no-op
      },
    };
  }

  const activeMail = mail;
  const mailtrapClient =
    activeMail.provider === 'mailtrap_api' ? new MailtrapClient({ token: activeMail.apiKey }) : null;
  const transporter =
    activeMail.provider === 'smtp'
      ? nodemailer.createTransport({
          host: activeMail.host,
          port: activeMail.port,
          secure: activeMail.secure,
          requireTLS: !activeMail.secure,
          auth: activeMail.user && activeMail.pass ? { user: activeMail.user, pass: activeMail.pass } : undefined,
          connectionTimeout: 15_000,
          greetingTimeout: 15_000,
          socketTimeout: 30_000,
        })
      : null;

  let credentialsTemplate: Handlebars.TemplateDelegate | null = null;
  let inquiryConfirmationTemplate: Handlebars.TemplateDelegate | null = null;
  let applicationConfirmationTemplate: Handlebars.TemplateDelegate | null = null;

  function getCredentialsTemplate(): Handlebars.TemplateDelegate {
    credentialsTemplate ??= loadTemplate('user-credentials');
    return credentialsTemplate;
  }

  function getInquiryConfirmationTemplate(): Handlebars.TemplateDelegate {
    inquiryConfirmationTemplate ??= loadTemplate('inquiry-confirmation');
    return inquiryConfirmationTemplate;
  }

  function getApplicationConfirmationTemplate(): Handlebars.TemplateDelegate {
    applicationConfirmationTemplate ??= loadTemplate('application-confirmation');
    return applicationConfirmationTemplate;
  }

  const SEND_TIMEOUT_MS = 30_000;
  const from = activeMail.fromName ? `"${activeMail.fromName}" <${activeMail.from}>` : activeMail.from;

  async function withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout')), SEND_TIMEOUT_MS);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    category: string;
  }): Promise<void> {
    if (activeMail.provider === 'mailtrap_api' && mailtrapClient) {
      await withTimeout(
        mailtrapClient.send({
          from: { name: activeMail.fromName, email: activeMail.from },
          to: [{ email: params.to }],
          subject: params.subject,
          text: params.text,
          html: params.html,
          category: params.category,
        }),
      );
      return;
    }

    if (transporter) {
      await withTimeout(
        transporter.sendMail({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
        }),
      );
      return;
    }

    throw new Error('Mailer not configured');
  }

  return {
    async sendUserCredentials(to: string, name: string, email: string, password: string) {
      try {
        const html = getCredentialsTemplate()({
          name,
          email,
          password,
        });
        await sendEmail({
          to,
          subject: 'Your account credentials',
          html,
          text: `Hello ${name}, your account credentials are ready.`,
          category: 'user_creation',
        });
        logger.info({ to }, 'Credentials email sent');
      } catch (err) {
        logger.warn({ err, to }, 'Failed to send credentials email');
        throw err;
      }
    },

    async sendInquiryConfirmation(to: string, fullName: string, inquiryId: string) {
      try {
        const html = getInquiryConfirmationTemplate()({
          fullName,
          inquiryId,
        });
        await sendEmail({
          to,
          subject: 'We received your quote request',
          html,
          text: `Hello ${fullName}, we received your quote request (${inquiryId}).`,
          category: 'inquiry_confirmation',
        });
        logger.info({ to, inquiryId }, 'Inquiry confirmation email sent');
      } catch (err) {
        logger.warn({ err, to, inquiryId }, 'Failed to send inquiry confirmation email');
        throw err;
      }
    },

    async sendApplicationConfirmation(to: string, fullName: string, applicationId: string) {
      try {
        const html = getApplicationConfirmationTemplate()({
          fullName,
          applicationId,
        });
        await sendEmail({
          to,
          subject: 'We received your job application',
          html,
          text: `Hello ${fullName}, we received your application (${applicationId}).`,
          category: 'application_confirmation',
        });
        logger.info({ to, applicationId }, 'Application confirmation email sent');
      } catch (err) {
        logger.warn({ err, to, applicationId }, 'Failed to send application confirmation email');
        throw err;
      }
    },
  };
}
