export interface ImageReference {
  page: string;
  section: string;
  tabId: string;
  path: string;
}

export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  let clean = url.trim().replace(/\\/g, "/");
  if (!clean.startsWith("/") && !clean.startsWith("http")) {
    clean = "/" + clean;
  }
  return clean;
}

export function findAllImageReferences(content: any): Map<string, ImageReference[]> {
  const refsMap = new Map<string, ImageReference[]>();

  if (!content) return refsMap;

  function registerRef(rawUrl: any, page: string, section: string, tabId: string, path: string) {
    if (!rawUrl || typeof rawUrl !== "string") return;
    const url = normalizeImageUrl(rawUrl);
    if (!url.startsWith("/images/") && !url.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)) {
      return;
    }
    const current = refsMap.get(url) || [];
    // Prevent duplicate entries for the same path
    if (!current.some((r) => r.path === path)) {
      current.push({ page, section, tabId, path });
      refsMap.set(url, current);
    }
  }

  // 1. Site meta / favicon / OG
  if (content.site) {
    if (content.site.og_image) {
      registerRef(content.site.og_image, "Sito & Meta", "Immagine Social Share (OG)", "site", "site.og_image");
    }
    if (content.site.favicon) {
      registerRef(content.site.favicon, "Sito & Meta", "Favicon", "site", "site.favicon");
    }
  }

  // 2. Home Page
  const home = content.pages?.home;
  if (home) {
    if (home.hero?.bg_image) {
      registerRef(home.hero.bg_image, "Home Page", "Hero (Sfondo)", "home", "pages.home.hero.bg_image");
    }
    if (home.hero?.image) {
      registerRef(home.hero.image, "Home Page", "Hero (Immagine)", "home", "pages.home.hero.image");
    }
    if (home.curtain_image) {
      registerRef(home.curtain_image, "Home Page", "Sipario / Banner Teatro", "home", "pages.home.curtain_image");
    }
    if (home.about_section?.image) {
      registerRef(home.about_section.image, "Home Page", "Sezione Chi Siamo", "home", "pages.home.about_section.image");
    }
    if (Array.isArray(home.introduction?.images)) {
      home.introduction.images.forEach((img: any, idx: number) => {
        if (img?.url) {
          registerRef(img.url, "Home Page", `Intro Gli Attomatti (Foto #${idx + 1}${img.alt ? `: ${img.alt}` : ""})`, "home", `pages.home.introduction.images.${idx}`);
        }
      });
    }
    if (Array.isArray(home.slideshow)) {
      home.slideshow.forEach((s: any, idx: number) => {
        if (s?.image) {
          registerRef(s.image, "Home Page", `Slideshow #${idx + 1}${s.title ? ` (${s.title})` : ""}`, "home", `pages.home.slideshow.${idx}`);
        }
      });
    }
    if (Array.isArray(home.upcoming_shows)) {
      home.upcoming_shows.forEach((sh: any, idx: number) => {
        if (sh?.image) {
          registerRef(sh.image, "Home Page", `Prossimi Spettacoli (${sh.title || `#${idx + 1}`})`, "home", `pages.home.upcoming_shows.${idx}`);
        }
      });
    }
  }

  // 3. Chi Siamo
  const chiSiamo = content.pages?.chi_siamo;
  if (chiSiamo) {
    if (chiSiamo.hero?.bg_image) {
      registerRef(chiSiamo.hero.bg_image, "Chi Siamo", "Hero (Sfondo)", "chi_siamo", "pages.chi_siamo.hero.bg_image");
    }
    if (chiSiamo.storia?.image) {
      registerRef(chiSiamo.storia.image, "Chi Siamo", "La Nostra Storia", "chi_siamo", "pages.chi_siamo.storia.image");
    }
    if (Array.isArray(chiSiamo.content_sections)) {
      chiSiamo.content_sections.forEach((sec: any, sIdx: number) => {
        const secLabel = sec.title || `#${sIdx + 1}`;
        if (Array.isArray(sec.images)) {
          sec.images.forEach((img: any, iIdx: number) => {
            if (img?.url) {
              registerRef(img.url, "Chi Siamo", `Sezione "${secLabel}" (Foto #${iIdx + 1})`, "chi_siamo", `pages.chi_siamo.content_sections.${sIdx}.images.${iIdx}`);
            }
          });
        }
        if (Array.isArray(sec.blocks)) {
          sec.blocks.forEach((block: any, bIdx: number) => {
            if (block.type === "gallery" && Array.isArray(block.images)) {
              block.images.forEach((img: any, iIdx: number) => {
                if (img?.url) {
                  registerRef(img.url, "Chi Siamo", `Sezione "${secLabel}" - Blocco #${bIdx + 1} (Foto #${iIdx + 1})`, "chi_siamo", `pages.chi_siamo.content_sections.${sIdx}.blocks.${bIdx}.images.${iIdx}`);
                }
              });
            }
          });
        }
      });
    }
    if (Array.isArray(chiSiamo.gallery)) {
      chiSiamo.gallery.forEach((g: any, idx: number) => {
        if (g?.url) {
          registerRef(g.url, "Chi Siamo", `Galleria Foto #${idx + 1}${g.alt ? ` (${g.alt})` : ""}`, "chi_siamo", `pages.chi_siamo.gallery.${idx}`);
        }
      });
    }
  }

  // 3b. Blog & Racconti
  const blog = content.pages?.blog;
  if (blog && Array.isArray(blog.articles)) {
    blog.articles.forEach((art: any, aIdx: number) => {
      const artTitle = art.title || `Articolo #${aIdx + 1}`;
      if (Array.isArray(art.content_sections)) {
        art.content_sections.forEach((sec: any, sIdx: number) => {
          const secTitle = sec.title || `Capitolo #${sIdx + 1}`;
          if (Array.isArray(sec.blocks)) {
            sec.blocks.forEach((b: any, bIdx: number) => {
              if (b.type === "gallery" && Array.isArray(b.images)) {
                b.images.forEach((img: any, iIdx: number) => {
                  if (img?.url) {
                    registerRef(
                      img.url,
                      "Blog",
                      `"${artTitle}" → ${secTitle} (Foto #${iIdx + 1})`,
                      "blog",
                      `pages.blog.articles.${aIdx}.content_sections.${sIdx}.blocks.${bIdx}.images.${iIdx}`
                    );
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  // 4. Cast & Staff (Attori)
  const attori = content.pages?.attori;
  if (attori) {
    if (attori.hero?.bg_image) {
      registerRef(attori.hero.bg_image, "Cast & Staff", "Hero (Sfondo)", "attori", "pages.attori.hero.bg_image");
    }
    const memberList = Array.isArray(attori.list) ? attori.list : Array.isArray(attori.members) ? attori.members : [];
    memberList.forEach((m: any, idx: number) => {
      if (m?.image) {
        registerRef(m.image, "Cast & Staff", `Foto ${m.name || `Membro #${idx + 1}`}${m.role ? ` (${m.role})` : ""}`, "attori", `pages.attori.members.${idx}`);
      }
    });
  }

  // 5. Spettacoli
  const spettacoli = content.pages?.spettacoli;
  if (spettacoli) {
    if (spettacoli.hero?.bg_image) {
      registerRef(spettacoli.hero.bg_image, "Spettacoli", "Hero (Sfondo)", "spettacoli", "pages.spettacoli.hero.bg_image");
    }
    if (Array.isArray(spettacoli.items)) {
      spettacoli.items.forEach((s: any, idx: number) => {
        const title = s.title || `Spettacolo #${idx + 1}`;
        if (s.image) {
          registerRef(s.image, "Spettacoli", `${title} (Locandina Principale)`, "spettacoli", `pages.spettacoli.items.${idx}.image`);
        }
        if (s.hero_image) {
          registerRef(s.hero_image, "Spettacoli", `${title} (Copertina Hero)`, "spettacoli", `pages.spettacoli.items.${idx}.hero_image`);
        }
        if (Array.isArray(s.gallery)) {
          s.gallery.forEach((g: any, gIdx: number) => {
            if (g?.url) {
              registerRef(g.url, "Spettacoli", `${title} > Galleria Foto #${gIdx + 1}${g.alt ? ` (${g.alt})` : ""}`, "spettacoli", `pages.spettacoli.items.${idx}.gallery.${gIdx}`);
            }
          });
        }
      });
    }
    if (Array.isArray(spettacoli.archive_sections)) {
      spettacoli.archive_sections.forEach((arch: any, aIdx: number) => {
        if (Array.isArray(arch.images)) {
          arch.images.forEach((img: any, iIdx: number) => {
            if (img?.url) {
              registerRef(img.url, "Spettacoli", `Archivio "${arch.title || `#${aIdx + 1}`}" (Foto #${iIdx + 1})`, "spettacoli", `pages.spettacoli.archive_sections.${aIdx}.images.${iIdx}`);
            }
          });
        }
      });
    }
  }

  // 6. Iniziative & Corsi
  const iniziative = content.pages?.iniziative;
  if (iniziative) {
    if (iniziative.hero?.bg_image) {
      registerRef(iniziative.hero.bg_image, "Iniziative & Corsi", "Hero (Sfondo)", "iniziative", "pages.iniziative.hero.bg_image");
    }
    if (Array.isArray(iniziative.items)) {
      iniziative.items.forEach((init: any, idx: number) => {
        const title = init.title || `Iniziativa #${idx + 1}`;
        if (init.image) {
          registerRef(init.image, "Iniziative & Corsi", `${title} (Locandina Principale)`, "iniziative", `pages.iniziative.items.${idx}.image`);
        }
        if (init.hero_image) {
          registerRef(init.hero_image, "Iniziative & Corsi", `${title} (Copertina Hero)`, "iniziative", `pages.iniziative.items.${idx}.hero_image`);
        }
        if (Array.isArray(init.gallery)) {
          init.gallery.forEach((g: any, gIdx: number) => {
            if (g?.url) {
              registerRef(g.url, "Iniziative & Corsi", `${title} > Galleria Foto #${gIdx + 1}${g.alt ? ` (${g.alt})` : ""}`, "iniziative", `pages.iniziative.items.${idx}.gallery.${gIdx}`);
            }
          });
        }
      });
    }
  }

  // 7. Dicono di Noi (Press)
  const press = content.pages?.parlano_di_noi;
  if (press) {
    if (press.hero?.bg_image) {
      registerRef(press.hero.bg_image, "Dicono di Noi", "Hero (Sfondo)", "parlano_di_noi", "pages.parlano_di_noi.hero.bg_image");
    }
    if (Array.isArray(press.articles)) {
      press.articles.forEach((art: any, idx: number) => {
        if (art?.image) {
          registerRef(art.image, "Dicono di Noi", `Articolo "${art.title || `#${idx + 1}`}"`, "parlano_di_noi", `pages.parlano_di_noi.articles.${idx}.image`);
        }
      });
    }
  }

  // 8. Landing Pages
  const landings = content.landings || content.pages?.landings;
  if (Array.isArray(landings)) {
    landings.forEach((land: any, idx: number) => {
      const landTitle = land.title || land.slug || `Landing #${idx + 1}`;
      if (land.hero?.image) {
        registerRef(land.hero.image, "Landing Pages", `${landTitle} (Hero Immagine)`, "landing", `landings.${idx}.hero.image`);
      }
      if (land.hero?.bg_image) {
        registerRef(land.hero.bg_image, "Landing Pages", `${landTitle} (Hero Sfondo)`, "landing", `landings.${idx}.hero.bg_image`);
      }
      if (Array.isArray(land.sections)) {
        land.sections.forEach((sec: any, sIdx: number) => {
          if (sec?.image) {
            registerRef(sec.image, "Landing Pages", `${landTitle} > Sezione "${sec.title || `#${sIdx + 1}`}"`, "landing", `landings.${idx}.sections.${sIdx}.image`);
          }
        });
      }
      if (Array.isArray(land.gallery)) {
        land.gallery.forEach((g: any, gIdx: number) => {
          if (g?.url) {
            registerRef(g.url, "Landing Pages", `${landTitle} > Galleria #${gIdx + 1}`, "landing", `landings.${idx}.gallery.${gIdx}`);
          }
        });
      }
    });
  }

  // 9. Generic recursive scanner for any other image URLs
  function deepWalk(node: any, currentPath: string) {
    if (!node) return;
    if (typeof node === "string") {
      if (node.startsWith("/images/") || node.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)) {
        const normalized = normalizeImageUrl(node);
        const existing = refsMap.get(normalized) || [];
        if (!existing.some((r) => r.path === currentPath)) {
          const parts = currentPath.split(".");
          const pageKey = parts[0] === "pages" ? (parts[1] || "Altre Pagine") : parts[0];
          const pageName = pageKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          registerRef(normalized, pageName, currentPath, pageKey, currentPath);
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((item, i) => deepWalk(item, `${currentPath}.${i}`));
    } else if (typeof node === "object") {
      Object.entries(node).forEach(([k, v]) => deepWalk(v, currentPath ? `${currentPath}.${k}` : k));
    }
  }

  deepWalk(content, "");

  return refsMap;
}
