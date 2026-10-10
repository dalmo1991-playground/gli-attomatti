"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Bus,
  Train,
  Car,
  Accessibility,
  ArrowLeft,
  ExternalLink,
  Info,
  Footprints,
  Compass,
  CheckCircle2,
  TramFront
} from "lucide-react";
import { LocationItem, LocationStep, LocationPublicTransport } from "@/lib/locationTypes";
import { Lightbox, LightboxImage } from "@/components/ui/Lightbox";
import { FormattedText } from "@/components/ui/FormattedText";
import { Section } from "@/components/ui/Section";
import { useLiveContent } from "@/components/dev/LivePreviewContext";
import { ShareButton } from "@/components/ui/ShareButton";
import { getSafeImageProps } from "@/lib/youtube";
import { defaultText } from "@/lib/utils";
import { resolveSlugText } from "@/lib/contentResolver";
import { trackViewContent } from "@/lib/tracking";

interface LocationClientProps {
  location?: LocationItem | null;
  slug?: string;
  content?: any;
}

export default function LocationClient({ location: initialLocation, slug, content: initialContent }: LocationClientProps) {
  const liveContent = useLiveContent(initialContent || null);
  const ui = liveContent?.pages?.locations || initialContent?.pages?.locations || {};

  // Live preview update support
  const location = React.useMemo(() => {
    if (liveContent?.locations) {
      const match = liveContent.locations.find(
        (l: any) =>
          (slug && l.slug === slug) ||
          (initialLocation?.slug && l.slug === initialLocation.slug) ||
          (initialLocation?.id && l.id === initialLocation.id)
      );
      if (match) return match;
    }
    return initialLocation || null;
  }, [liveContent, initialLocation, slug]);

  React.useEffect(() => {
    if (location?.name) {
      trackViewContent(location.name, "Location", { slug: location.slug });
    }
  }, [location?.name, location?.slug]);

  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: LightboxImage[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  if (!location) {
    const notFoundTitle = defaultText(ui.not_found_title, "Location non trovata");
    const notFoundDesc = defaultText(ui.not_found_description);
    const notFoundBtn = defaultText(ui.not_found_button_label, "Torna all'elenco");

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <MapPin size={48} className="text-primary/40 mb-4 animate-pulse" />
        {notFoundTitle && (
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground mb-3">
            {notFoundTitle}
          </h1>
        )}
        {notFoundDesc && (
          <p className="text-foreground/60 max-w-md mx-auto text-sm mb-6 leading-relaxed">
            {notFoundDesc}
          </p>
        )}
        {notFoundBtn && (
          <Link
            href="/Location"
            prefetch={false}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20"
          >
            <ArrowLeft size={14} />
            <span>{notFoundBtn}</span>
          </Link>
        )}
      </div>
    );
  }

  const steps: LocationStep[] = location.steps || [];
  const transports: LocationPublicTransport[] = location.public_transport || [];

  // Prepare images for lightbox from the step images
  const stepImages: LightboxImage[] = steps
    .filter((s) => s.image && s.image.trim().length > 0)
    .map((s) => ({
      url: s.image?.trim(),
      alt: s.title || s.image_caption || ui.image_alt_fallback || ""
    }));

  const openLightboxForStep = (stepImgUrl?: string) => {
    if (!stepImgUrl) return;
    const foundIdx = stepImages.findIndex((img) => img.url === stepImgUrl);
    if (foundIdx >= 0) {
      setLightbox({
        isOpen: true,
        index: foundIdx,
        images: stepImages
      });
    }
  };

  const getTransportIcon = (type?: string) => {
    switch (type) {
      case "tram":
      case "bus":
        return Bus;
      case "train":
        return Train;
      default:
        return Navigation;
    }
  };

  const backLinkLabel = resolveSlugText(location.back_link_label, ui.back_link_default_label, "Torna indietro");
  const topBadge = resolveSlugText(location.top_badge);
  const badge = resolveSlugText(location.badge, ui.default_badge);
  const venueName = resolveSlugText(location.venue_name, location.title);
  const mapsButtonLabel = resolveSlugText(location.google_maps_button_label, ui.google_maps_button_label, "Apri in Google Maps");
  const publicTransportHeading = resolveSlugText(location.public_transport_heading, ui.public_transport_heading, "Mezzi pubblici");
  const stepsHeading = resolveSlugText(location.steps_heading, ui.steps_heading, "Guida fotografica");
  const stepSingle = resolveSlugText(location.step_single_label, ui.step_single_label, "passo");
  const stepPlural = resolveSlugText(location.step_plural_label, ui.step_plural_label, "passi");
  const clickToEnlarge = resolveSlugText(location.click_to_enlarge_label, ui.click_to_enlarge_label, "Ingrandisci");
  const photoPrefix = resolveSlugText(location.photo_prefix, ui.photo_prefix, "Foto:");
  const parkingHeading = resolveSlugText(location.parking_heading, ui.parking_heading, "Parcheggio");
  const accessibilityHeading = resolveSlugText(location.accessibility_heading, ui.accessibility_heading, "Accessibilità");
  const notesHeading = resolveSlugText(location.notes_heading, ui.notes_heading, "Note pratiche");
  const bottomBackLabel = resolveSlugText(location.bottom_back_label, location.back_link_label, ui.bottom_back_button_label || "Torna indietro");

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          {backLinkLabel && (
            <Link
              href={location.back_link_href || "/"}
              prefetch={false}
              className="inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              <span>{backLinkLabel}</span>
            </Link>
          )}

          {topBadge && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              {topBadge}
            </span>
          )}
        </div>

        {/* Hero Card with Venue Info */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-muted/30 via-muted/15 to-background border border-foreground/10 p-6 sm:p-10 overflow-hidden shadow-2xl glass">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider">
                <MapPin size={14} />
                <span>{badge}</span>
              </div>
            )}

            {venueName && (
              <div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground text-balance break-words">
                  {venueName}
                </h1>
                {location.venue_name && location.title !== location.venue_name && (
                  <p className="text-base sm:text-lg text-primary font-bold mt-1">
                    {location.title}
                  </p>
                )}
              </div>
            )}

            {/* Address & Quick Links */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-foreground/10">
              {location.address && (
                <div className="flex items-start gap-2.5 text-foreground/80 font-medium text-sm sm:text-base">
                  <Compass className="text-accent shrink-0 mt-0.5" size={18} />
                  <span>{location.address}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
                <ShareButton
                  variant="button"
                  label="Condividi sala"
                  title={`${location.venue_name || location.title} — Gli Attomatti`}
                  description={location.description || location.address}
                  uiContent={liveContent?.ui?.share_modal}
                />

                {location.google_maps_url && mapsButtonLabel && (
                  <Link
                    href={location.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-primary/20 shrink-0"
                  >
                    <Navigation size={14} />
                    <span>{mapsButtonLabel}</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </Link>
                )}
              </div>
            </div>

            {location.description && (
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed font-medium pt-2">
                <FormattedText text={location.description} />
              </p>
            )}

            {location.tags && location.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {location.tags.map((tag: string, tIdx: number) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/80 text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Public Transport Stops */}
        {transports.length > 0 && (
          <div className="p-6 sm:p-8 rounded-[2rem] bg-muted/20 border border-foreground/5 space-y-4">
            {publicTransportHeading && (
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-2.5">
                <Bus size={20} className="text-secondary" />
                <span>{publicTransportHeading}</span>
              </h2>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {transports.map((t, idx) => {
                const types = (t.types && t.types.length > 0) ? t.types : [t.type || "tram"];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-background/60 border border-foreground/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-xl bg-secondary/10 text-secondary" title={ui.transport_tram_title || ""}>
                        {types.includes("tram") && <TramFront size={16} className="text-emerald-400" />}
                        {types.includes("bus") && <Bus size={16} className="text-sky-400" />}
                        {types.includes("train") && <Train size={16} className="text-indigo-400" />}
                        {types.includes("generic") && !types.includes("tram") && !types.includes("bus") && !types.includes("train") && (
                          <Navigation size={16} className="text-amber-400" />
                        )}
                      </div>
                      {t.walking_time && (
                        <span className="text-[11px] font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                          {t.walking_time}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-foreground pt-1">{t.stop}</div>

                    {/* Line Badges (ZVV / Tram / Bus / S-Bahn style) */}
                    {t.line_badges && t.line_badges.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <div className="flex items-center gap-1 text-foreground/40 shrink-0 mr-1" title={ui.transport_tram_title || ""}>
                          {types.includes("tram") && <TramFront size={13} />}
                          {types.includes("bus") && <Bus size={13} />}
                          {types.includes("train") && <Train size={13} />}
                        </div>
                        {t.line_badges.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-[6px] text-xs font-black shadow-sm tracking-tight select-none border border-black/15"
                            style={{
                              backgroundColor: b.bg_color || "#000000",
                              color: b.text_color || "#ffffff"
                            }}
                          >
                            {b.number}
                          </span>
                        ))}
                      </div>
                    ) : (
                      t.lines && (
                        <div className="text-xs text-foreground/50 font-medium">
                          {ui.lines_prefix ? `${ui.lines_prefix} ` : ""}{t.lines}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step-by-Step Photo Itinerary */}
        {steps.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {stepsHeading && (
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2.5">
                  <Footprints size={22} className="text-accent" />
                  <span>{stepsHeading}</span>
                </h2>
              )}
              {(stepSingle || stepPlural) && (
                <span className="text-xs text-foreground/40 font-bold uppercase tracking-wider">
                  {steps.length} {steps.length === 1 ? (stepSingle || "") : (stepPlural || "")}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="rounded-[2rem] bg-muted/15 border border-foreground/10 overflow-hidden transition-all hover:border-foreground/20 shadow-sm"
                >
                  <div className="p-6 sm:p-7 space-y-4">
                    {/* Step Number & Title */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-2xl bg-accent/15 text-accent border border-accent/20 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1 flex-1">
                        {step.title && (
                          <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                            {step.title}
                          </h3>
                        )}
                        {step.instruction && (
                          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium">
                            <FormattedText text={step.instruction} />
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step Photo (with click to enlarge Lightbox) */}
                    {step.image && step.image.trim().length > 0 && (
                      <div className="pt-2">
                        <div
                          onClick={() => openLightboxForStep(step.image)}
                          className="relative aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden border border-foreground/10 bg-background/50 cursor-pointer group shadow-inner"
                        >
                          {(() => {
                            const { src: stepSrc, unoptimized: isStepUnoptimized } = getSafeImageProps(step.image);
                            return (
                              <Image
                                src={stepSrc}
                                alt={step.title || ui.image_alt_fallback || ""}
                                fill
                                unoptimized={isStepUnoptimized}
                                sizes="(max-width: 896px) 100vw, 896px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            );
                          })()}
                          {clickToEnlarge && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                              <span className="text-xs text-white font-bold px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md">
                                {clickToEnlarge}
                              </span>
                            </div>
                          )}
                        </div>
                        {step.image_caption && (
                          <p className="text-xs text-foreground/50 italic mt-2 px-1">
                            {photoPrefix ? `${photoPrefix} ` : ""}{step.image_caption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Notes & Facilities (Parking, Accessibility, Notes) */}
        {(location.parking_info || location.accessibility_info || location.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {location.parking_info && (
              <div className="p-6 rounded-[2rem] bg-muted/15 border border-foreground/10 space-y-2">
                {parkingHeading && (
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-foreground">
                    <Car size={16} className="text-accent" />
                    <span>{parkingHeading}</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
                  <FormattedText text={location.parking_info} />
                </p>
              </div>
            )}

            {location.accessibility_info && (
              <div className="p-6 rounded-[2rem] bg-muted/15 border border-foreground/10 space-y-2">
                {accessibilityHeading && (
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-foreground">
                    <Accessibility size={16} className="text-secondary" />
                    <span>{accessibilityHeading}</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
                  <FormattedText text={location.accessibility_info} />
                </p>
              </div>
            )}

            {location.notes && (
              <div className="md:col-span-2 p-6 rounded-[2rem] bg-foreground/5 border border-foreground/5 space-y-2">
                {notesHeading && (
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground/60">
                    <Info size={14} className="text-primary" />
                    <span>{notesHeading}</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
                  <FormattedText text={location.notes} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA to return */}
        {bottomBackLabel && (
          <div className="text-center pt-6 pb-12">
            <Link
              href={location.back_link_href || "/"}
              prefetch={false}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground font-black text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={16} />
              <span>{bottomBackLabel}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox for step photos */}
      <Lightbox
        images={lightbox.images}
        initialIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
