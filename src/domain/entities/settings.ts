export type WhoWeSupportGroup = {
  label: string;
  description: string;
};

export type WhoWeSupportSection = {
  section_title: string;
  section_intro: string;
  groups: WhoWeSupportGroup[];
};

export interface SettingsData {
  primary_phone?: string | null;
  primary_email?: string | null;
  office_hours_text?: string | null;
  service_area_text?: string | null;
  service_area_postcodes?: string[] | null;
  hero_badge_text?: string | null;
  hero_headline?: string | null;
  hero_headline_highlight?: string | null;
  hero_subtext?: string | null;
  hero_images?: string[] | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  who_we_support?: WhoWeSupportSection | null;
}

export class Settings {
  readonly id: string;
  readonly primary_phone: string | null;
  readonly primary_email: string | null;
  readonly office_hours_text: string | null;
  readonly service_area_text: string | null;
  readonly service_area_postcodes: string[] | null;
  readonly hero_badge_text: string | null;
  readonly hero_headline: string | null;
  readonly hero_headline_highlight: string | null;
  readonly hero_subtext: string | null;
  readonly hero_images: string[] | null;
  readonly social_facebook: string | null;
  readonly social_instagram: string | null;
  readonly social_twitter: string | null;
  readonly social_linkedin: string | null;
  readonly logo_url: string | null;
  readonly favicon_url: string | null;
  readonly who_we_support: WhoWeSupportSection | null;
  readonly updated_at: Date;

  constructor(params: { id: string; updated_at: Date } & SettingsData) {
    this.id = params.id;
    this.updated_at = params.updated_at;
    this.primary_phone = params.primary_phone ?? null;
    this.primary_email = params.primary_email ?? null;
    this.office_hours_text = params.office_hours_text ?? null;
    this.service_area_text = params.service_area_text ?? null;
    this.service_area_postcodes = params.service_area_postcodes ?? null;
    this.hero_badge_text = params.hero_badge_text ?? null;
    this.hero_headline = params.hero_headline ?? null;
    this.hero_headline_highlight = params.hero_headline_highlight ?? null;
    this.hero_subtext = params.hero_subtext ?? null;
    this.hero_images = params.hero_images ?? null;
    this.social_facebook = params.social_facebook ?? null;
    this.social_instagram = params.social_instagram ?? null;
    this.social_twitter = params.social_twitter ?? null;
    this.social_linkedin = params.social_linkedin ?? null;
    this.logo_url = params.logo_url ?? null;
    this.favicon_url = params.favicon_url ?? null;
    this.who_we_support = params.who_we_support ?? null;
  }
}
