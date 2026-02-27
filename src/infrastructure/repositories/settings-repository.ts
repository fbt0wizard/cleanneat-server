import { Settings } from '@domain/entities';
import type { SettingsRepository, SettingsUpdate } from '@domain/repositories';
import type { PrismaClient, Settings as SettingsModel } from '@prisma/client';

const DEFAULT_ID = 'default';

export function makeSettingsRepository(db: PrismaClient): SettingsRepository {
  return {
    async get() {
      const record = await db.settings.findUnique({ where: { id: DEFAULT_ID } });
      if (!record) return null;
      return toEntity(record);
    },

    async upsert(updates) {
      const data = toPrismaData(updates);
      const record = await db.settings.upsert({
        where: { id: DEFAULT_ID },
        create: { id: DEFAULT_ID, ...data },
        update: data,
      });
      return toEntity(record);
    },
  };
}

const SETTINGS_KEYS: (keyof SettingsUpdate)[] = [
  'primary_phone',
  'primary_email',
  'office_hours_text',
  'service_area_text',
  'service_area_postcodes',
  'hero_badge_text',
  'hero_headline',
  'hero_headline_highlight',
  'hero_subtext',
  'hero_images',
  'social_facebook',
  'social_instagram',
  'social_twitter',
  'social_linkedin',
  'logo_url',
  'favicon_url',
  'who_we_support',
];

function toPrismaData(updates: SettingsUpdate): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SETTINGS_KEYS) {
    if (updates[key] !== undefined) out[key] = updates[key];
  }
  return out;
}

function toEntity(record: SettingsModel): Settings {
  const whoWeSupport =
    record.who_we_support && typeof record.who_we_support === 'object'
      ? (record.who_we_support as {
          section_title?: unknown;
          section_intro?: unknown;
          groups?: unknown;
        })
      : null;

  const parsedWhoWeSupport =
    whoWeSupport &&
    typeof whoWeSupport.section_title === 'string' &&
    typeof whoWeSupport.section_intro === 'string' &&
    Array.isArray(whoWeSupport.groups)
      ? {
          section_title: whoWeSupport.section_title,
          section_intro: whoWeSupport.section_intro,
          groups: whoWeSupport.groups.flatMap((group) => {
            if (
              group &&
              typeof group === 'object' &&
              typeof (group as { label?: unknown }).label === 'string' &&
              typeof (group as { description?: unknown }).description === 'string'
            ) {
              return [
                {
                  label: (group as { label: string }).label,
                  description: (group as { description: string }).description,
                },
              ];
            }
            return [];
          }),
        }
      : null;

  return new Settings({
    id: record.id,
    primary_phone: record.primary_phone,
    primary_email: record.primary_email,
    office_hours_text: record.office_hours_text,
    service_area_text: record.service_area_text,
    service_area_postcodes: Array.isArray(record.service_area_postcodes)
      ? (record.service_area_postcodes as string[])
      : null,
    hero_badge_text: record.hero_badge_text,
    hero_headline: record.hero_headline,
    hero_headline_highlight: record.hero_headline_highlight,
    hero_subtext: record.hero_subtext,
    hero_images: Array.isArray(record.hero_images) ? (record.hero_images as string[]) : null,
    social_facebook: record.social_facebook,
    social_instagram: record.social_instagram,
    social_twitter: record.social_twitter,
    social_linkedin: record.social_linkedin,
    logo_url: record.logo_url,
    favicon_url: record.favicon_url,
    who_we_support: parsedWhoWeSupport,
    updated_at: record.updated_at,
  });
}
