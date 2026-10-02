"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center text-primary font-bold hover:gap-2 transition-all group select-none",
        className
      )}
    >
      <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
