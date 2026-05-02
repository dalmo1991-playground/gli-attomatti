"use client";

import { Section } from "@/components/ui/Section";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AttoriClient({ content }: { content: any }) {
  const { attori } = content.pages;
  const { join_us } = attori;

  return (
    <div className="pt-20">
      {/* Header */}
      <Section className="bg-muted/30 py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/Chi_Siamo" 
            className="inline-flex items-center text-primary font-bold mb-8 hover:gap-2 transition-all group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            Torna a Chi Siamo
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter"
          >
            {attori.title}
          </motion.h1>
          <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          <p className="text-xl text-foreground/70 font-medium">
            Le persone che rendono possibile la magia del teatro Attomatti.
          </p>
        </div>
      </Section>

      {/* Actors Grid */}
      <Section className="py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {attori.list.map((person: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group text-center"
            >
              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* Decorative Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 group-hover:scale-125 group-hover:border-primary/50 transition-all duration-700" />
                
                {/* Profile Pic */}
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-8 ring-background group-hover:ring-primary/10 transition-all duration-700">
                  <img 
                    src={person.image} 
                    alt={person.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                  {person.name}
                </h3>
                <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  {person.role}
                </div>
                <p className="text-foreground/60 leading-relaxed max-w-sm mx-auto pt-4 border-t border-foreground/5">
                  {person.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Join Us Call to Action */}
      {join_us && (
        <Section className="bg-muted/10 py-24 text-center border-t border-foreground/5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
              {join_us.title}
            </h2>
            <p className="text-lg text-foreground/60 mb-10">
              {join_us.text}
            </p>
            <Link 
              href={join_us.cta_href}
              className="px-10 py-5 bg-primary text-white rounded-full font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 inline-block"
            >
              {join_us.cta_label}
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
}
