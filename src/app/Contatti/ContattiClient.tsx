"use client";

import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { RichText } from "@/components/ui/RichText";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackContact } from "@/lib/tracking";

export default function ContattiClient({ content }: { content: any }) {
  const { contatti } = content.pages;

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
        title={contatti.title}
        description={contatti.description}
      />

      {/* Contact Cards */}
      <Section className="py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Email Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 bg-muted/20 rounded-[3rem] border border-foreground/5 flex flex-col items-center text-center group hover:bg-background hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
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


          {/* Social Cards */}
          {contatti.socials.map((social: any, idx: number) => {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-12 bg-muted/20 rounded-[3rem] border border-foreground/5 flex flex-col items-center text-center group hover:bg-background hover:border-primary/20 transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <SocialIcon platform={social.platform} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-40">{social.platform}</h2>
                <Link 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl md:text-3xl font-black hover:text-primary transition-colors"
                >
                  {social.handle}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Section>

    </div>
  );
}
