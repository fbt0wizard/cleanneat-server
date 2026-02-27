import type { Settings } from '../entities';

export type SettingsUpdate = Partial<{
  primary_phone: string | null;
  primary_email: string | null;
  office_hours_text: string | null;
  service_area_text: string | null;
  service_area_postcodes: string[] | null;
  hero_badge_text: string | null;
  hero_headline: string | null;
  hero_headline_highlight: string | null;
  hero_subtext: string | null;
  hero_images: string[] | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  who_we_support: {
    section_title: string;
    section_intro: string;
    groups: Array<{
      label: string;
      description: string;
    }>;
  } | null;
}>;

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  upsert(updates: SettingsUpdate): Promise<Settings>;
}
