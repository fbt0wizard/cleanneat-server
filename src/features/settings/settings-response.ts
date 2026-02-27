import type { Settings } from '@domain/entities';

export function toSettingsResponse(settings: Settings) {
  return {
    primary_phone: settings.primary_phone,
    primary_email: settings.primary_email,
    office_hours_text: settings.office_hours_text,
    service_area_text: settings.service_area_text,
    service_area_postcodes: settings.service_area_postcodes,
    hero_badge_text: settings.hero_badge_text,
    hero_headline: settings.hero_headline,
    hero_headline_highlight: settings.hero_headline_highlight,
    hero_subtext: settings.hero_subtext,
    hero_images: settings.hero_images,
    social_facebook: settings.social_facebook,
    social_instagram: settings.social_instagram,
    social_twitter: settings.social_twitter,
    social_linkedin: settings.social_linkedin,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
    who_we_support: settings.who_we_support,
  };
}
