import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
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
    logger.info('Mail not configured (SMTP_HOST/MAIL_FROM missing); credential emails disabled');
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

  const transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: false,
    requireTLS: true,
    auth: mail.user && mail.pass ? { user: mail.user, pass: mail.pass } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });

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

  return {
    async sendUserCredentials(to: string, name: string, email: string, password: string) {
      try {
        const html = getCredentialsTemplate()({
          name,
          email,
          password,
        });

        const sendPromise = transporter.sendMail({
          from: mail.fromName ? `"${mail.fromName}" <${mail.from}>` : mail.from,
          to,
          subject: 'Your account credentials',
          html,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), SEND_TIMEOUT_MS);
        });

        await Promise.race([sendPromise, timeoutPromise]);
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

        const sendPromise = transporter.sendMail({
          from: mail.fromName ? `"${mail.fromName}" <${mail.from}>` : mail.from,
          to,
          subject: 'We received your quote request',
          html,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), SEND_TIMEOUT_MS);
        });

        await Promise.race([sendPromise, timeoutPromise]);
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

        const sendPromise = transporter.sendMail({
          from: mail.fromName ? `"${mail.fromName}" <${mail.from}>` : mail.from,
          to,
          subject: 'We received your job application',
          html,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), SEND_TIMEOUT_MS);
        });

        await Promise.race([sendPromise, timeoutPromise]);
        logger.info({ to, applicationId }, 'Application confirmation email sent');
      } catch (err) {
        logger.warn({ err, to, applicationId }, 'Failed to send application confirmation email');
        throw err;
      }
    },
  };
}
