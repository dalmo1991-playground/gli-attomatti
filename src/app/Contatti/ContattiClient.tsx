"use client";

import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";
import { Mail, Camera, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ContattiClient({ content }: { content: any }) {
  const { contatti } = content.pages;

  const socialIcons: Record<string, any> = {
    "Instagram": Camera,
    "Facebook": Globe
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
            const Icon = socialIcons[social.platform] || ArrowRight;
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
                  <Icon size={40} />
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

      {/* Newsletter / Join Us CTA */}
      <Section className="py-24 bg-primary text-white rounded-t-[4rem] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase italic">
            "Sali sul palco con noi"
          </h2>
          <p className="text-xl opacity-80 mb-12 font-medium">
            Siamo sempre aperti a nuove collaborazioni e talenti. Non essere timido, scrivi una mail e raccontaci chi sei!
          </p>
          <Link 
            href={`mailto:${contatti.email}`}
            className="px-12 py-6 bg-white text-primary rounded-full font-black text-xl hover:bg-opacity-90 transition-all shadow-2xl hover:-translate-y-1 inline-block"
          >
            Inviaci una Mail
          </Link>
        </div>
      </Section>
    </div>
  );
}
