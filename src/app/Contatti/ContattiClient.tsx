"use client";

import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    <div className="pt-20 min-h-screen">
      {/* Hero Section */}
      <Section className="bg-muted/30 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tighter"
          >
            {contatti.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-1 bg-primary mx-auto mb-8"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-medium"
          >
            {contatti.description}
          </motion.p>
        </div>
      </Section>

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
