"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { XoConnectButton } from "@/components/landing/xo-connect-button";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Swap", href: "#swap" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Docs", href: "#docs" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-cyan-400/20 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2" aria-label="Vify home">
          <Image src="/logo.png" alt="Vify logo" width={100} height={34} className="w-full h-full" priority />
         
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors hover:text-cyan-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <XoConnectButton />
          <ConnectButton />
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-200 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-cyan-400/20 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3">
              <div className="mb-3">
                <XoConnectButton />
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
