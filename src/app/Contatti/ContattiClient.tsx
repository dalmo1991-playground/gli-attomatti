"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackContact } from "@/lib/tracking";
import { useLiveContent } from "@/components/dev/LivePreviewContext";

export default function ContattiClient({ content: initialContent }: { content: any }) {
  const content = useLiveContent(initialContent);
  const contatti = content?.pages?.contatti || {
    title: "Contattaci",
    description: "Siamo felici di ascoltarti. Scrivici per informazioni sugli spettacoli, collaborazioni o semplicemente per un saluto.",
    email: "compagniateatralegliattomatti@gmail.com",
    socials: []
  };
  const socials: any[] = Array.isArray(contatti.socials) ? contatti.socials : [];

  const SocialIcon = ({ platform }: { platform: string }) => {
    if (platform === "Facebook") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    }
    if (platform === "Instagram") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    }
    return <ArrowRight size={40} />;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PageHeader
        title={contatti.title || "Contattaci"}
        description={contatti.description || "Siamo felici di ascoltarti. Scrivici per informazioni sugli spettacoli, collaborazioni o semplicemente per un saluto."}
      />

      {/* Contact Cards */}
      <Section className="py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Email Card */}
          {contatti.email && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 sm:p-12 bg-muted/20 rounded-3xl border border-foreground/5 flex flex-col items-center text-center group hover:bg-background hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Mail size={40} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-40">Email</h2>
              <Link 
                href={`mailto:${contatti.email}`}
                onClick={() => trackContact("email", contatti.email)}
                className="text-2xl md:text-3xl font-black hover:text-primary transition-colors break-all"
              >
                {contatti.email}
              </Link>
            </motion.div>
          )}

          {/* Social Cards */}
          {socials.filter((s: any) => s && s.visible !== false).map((social: any, idx: number) => {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-8 sm:p-12 bg-muted/20 rounded-3xl border border-foreground/5 flex flex-col items-center text-center group hover:bg-background hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <SocialIcon platform={social.platform} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-40">{social.platform}</h2>
                {social.href ? (
                  <Link 
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl md:text-3xl font-black hover:text-primary transition-colors"
                  >
                    {social.handle || social.platform}
                  </Link>
                ) : (
                  <div className="text-2xl md:text-3xl font-black">
                    {social.handle || social.platform}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

    </div>
  );
}
