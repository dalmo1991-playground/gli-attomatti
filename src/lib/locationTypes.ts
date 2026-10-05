export interface PublicTransportLineBadge {
  number: string;
  bg_color?: string; // hex, e.g. #000000, #1e3a8a, #db2777
  text_color?: string; // hex or 'white' | 'black' | 'yellow'
}

export type TransportType = "tram" | "bus" | "train" | "generic";

export interface LocationPublicTransport {
  type?: TransportType; // legacy single type
  types?: TransportType[]; // multi-select: stop can serve tram, bus, and train simultaneously
  stop: string;
  lines?: string;
  line_badges?: PublicTransportLineBadge[];
  walking_time?: string;
  color?: string; // custom accent color
}

export interface LocationStep {
  id: string;
  title: string;
  instruction: string;
  image?: string;
  image_caption?: string;
}

export interface LocationItem {
  id: string;
  slug: string;
  title: string;
  venue_name?: string;
  address: string;
  google_maps_url?: string;
  active: boolean;
  hero_image?: string;
  description?: string;
  public_transport?: LocationPublicTransport[];
  steps?: LocationStep[];
  parking_info?: string;
  accessibility_info?: string;
  notes?: string;
  badge?: string; // Hero badge (default: "Indicazioni Teatro & Location")
  top_badge?: string; // Top bar badge (e.g. "Guida Fotografica & Percorso")
  category_badge?: string; // Hub card badge (default: "Location Teatrale")
  tags?: string[]; // Extra feature tags/badges
  back_link_label?: string;
  back_link_href?: string;
  steps_heading?: string;
  public_transport_heading?: string;
  parking_heading?: string;
  accessibility_heading?: string;
  notes_heading?: string;
}

export interface LocationPageStrings {
  meta_title?: string;
  meta_description?: string;
  hub_title?: string;
  hub_description?: string;
  hub_badge_default?: string;
  hub_steps_suffix?: string;
  hub_view_directions_label?: string;
  hub_empty_title?: string;
  hub_empty_description?: string;
  default_badge?: string;
  google_maps_button_label?: string;
  public_transport_heading?: string;
  lines_prefix?: string;
  steps_heading?: string;
  step_single_label?: string;
  step_plural_label?: string;
  click_to_enlarge_label?: string;
  parking_heading?: string;
  accessibility_heading?: string;
  notes_heading?: string;
  back_link_default_label?: string;
  bottom_back_button_label?: string;
  not_found_title?: string;
  not_found_description?: string;
  not_found_button_label?: string;
}
