/**
 * Gli Attomatti - Standard Page Blocks Architecture
 * Type definitions for composable page blocks (used across Landing Pages & Site Archetypes).
 */

export type PageBlockType =
  | "hero"
  | "event_details"
  | "synopsis"
  | "gallery"
  | "carousel"
  | "timeline_section"
  | "catalog_grid"
  | "eventfrog"
  | "tally"
  | "reviews"
  | "faq"
  | "closing_cta"
  | "rich_text";

export interface BasePageBlock {
  id: string;
  type: PageBlockType;
  enabled?: boolean;
  anchor?: string;
}

export interface HeroPageBlock extends BasePageBlock {
  type: "hero";
  badge?: string;
  title: string;
  tagline?: string;
  hero_image?: string;
  hero_image_align?: "center" | "top" | "bottom" | "left" | "right";
  primary_cta_label?: string;
  primary_cta_href?: string;
  secondary_cta_label?: string;
  secondary_cta_href?: string;
}

export interface EventDetailsPageBlock extends BasePageBlock {
  type: "event_details";
  title?: string;
  date?: string;
  location?: string;
  location_href?: string;
  price?: string;
  info_badge?: string;
  cta_label?: string;
  cta_href?: string;
}

export interface SynopsisPageBlock extends BasePageBlock {
  type: "synopsis";
  title?: string;
  text: string;
  quote?: string;
  quote_author?: string;
  image?: string;
}

export interface GalleryPageBlock extends BasePageBlock {
  type: "gallery";
  title?: string;
  images: Array<{
    url: string;
    alt?: string;
    caption?: string;
    no_crop?: boolean;
  }>;
}

export interface CarouselPageBlock extends BasePageBlock {
  type: "carousel";
  title?: string;
  images: Array<{
    url: string;
    alt?: string;
    caption?: string;
    no_crop?: boolean;
  }>;
  aspect_ratio?: string;
  autoplay_interval_ms?: number;
}

export interface TimelineSectionPageBlock extends BasePageBlock {
  type: "timeline_section";
  badge?: string;
  badge_prefix?: string;
  title: string;
  text?: string;
  cta_label?: string;
  cta_href?: string;
  is_alternate?: boolean;
  images?: Array<{
    url: string;
    alt?: string;
    no_crop?: boolean;
  }>;
}

export interface CatalogGridPageBlock extends BasePageBlock {
  type: "catalog_grid";
  title?: string;
  description?: string;
  category?: "biglietti" | "registrazioni" | "spettacoli" | "iniziative";
  items: Array<{
    id?: string;
    title: string;
    slug?: string;
    category?: string;
    date?: string;
    location?: string;
    price?: string;
    image?: string;
    description?: string;
    action_url?: string;
    action_label?: string;
    detail_url?: string;
    detail_label?: string;
  }>;
}

export interface EventfrogPageBlock extends BasePageBlock {
  type: "eventfrog";
  title?: string;
  subtitle?: string;
  eventfrog_url: string;
  fallback_label?: string;
  show_terms_note?: boolean;
}

export interface TallyPageBlock extends BasePageBlock {
  type: "tally";
  title?: string;
  subtitle?: string;
  tally_url: string;
  fallback_label?: string;
  show_privacy_note?: boolean;
}

export interface ReviewItem {
  quote: string;
  author: string;
  rating?: number;
  role?: string;
}

export interface ReviewsPageBlock extends BasePageBlock {
  type: "reviews";
  title?: string;
  items: ReviewItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPageBlock extends BasePageBlock {
  type: "faq";
  title?: string;
  items: FaqItem[];
}

export interface ClosingCtaPageBlock extends BasePageBlock {
  type: "closing_cta";
  title: string;
  text?: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label?: string;
  secondary_cta_href?: string;
}

export interface RichTextPageBlock extends BasePageBlock {
  type: "rich_text";
  title?: string;
  content: string;
}

export type PageBlock =
  | HeroPageBlock
  | EventDetailsPageBlock
  | SynopsisPageBlock
  | GalleryPageBlock
  | CarouselPageBlock
  | TimelineSectionPageBlock
  | CatalogGridPageBlock
  | EventfrogPageBlock
  | TallyPageBlock
  | ReviewsPageBlock
  | FaqPageBlock
  | ClosingCtaPageBlock
  | RichTextPageBlock;
