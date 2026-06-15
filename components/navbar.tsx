"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Menu, Phone, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Hearing Aids", href: "#hearing-aids" },
  { label: "Gallery", href: "#gallery" },
  { label: "Appointment", href: "#appointment" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 shadow-lg backdrop-blur-md"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="hidden border-b border-border/70 bg-primary text-primary-foreground lg:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs font-medium sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> Sanchi Road, Vidisha, M.P.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> Mon-Sat: 11:00 AM - 8:00 PM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:9755018656"
              className="inline-flex items-center gap-1.5 hover:text-white/80"
            >
              <Phone size={14} /> 9755018656
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16 lg:h-20">
          <button
            onClick={() => handleNavClick("#home")}
            className="group flex min-w-0 items-center gap-2 text-left sm:gap-3"
            aria-label="Arogya Speech Therapy - Go to top"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm transition-transform group-hover:scale-105 sm:h-11 sm:w-11">
              <span className="text-lg font-bold text-primary-foreground">
                A
              </span>
            </div>

            <div className="leading-tight">
              <div className="truncate text-sm font-extrabold text-foreground sm:text-base">
                Arogya Speech Therapy
              </div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
                Vidisha Hearing Care
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-foreground/75 transition-all duration-200 hover:bg-secondary hover:text-primary"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/portal"
              className="hidden rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-slate-800 lg:inline-flex portal-login-top-mobile-hide"
            >
              Portal Login
            </a>

            <button
              onClick={() => handleNavClick("#appointment")}
              className="hidden rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-105 lg:inline-flex"
              style={{ background: "var(--warm-orange)" }}
            >
              Book Appointment
            </button>

            <button
              className="rounded-xl p-2 text-foreground transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-border bg-white transition-all duration-300 lg:hidden ${
          isMenuOpen ? "max-h-[34rem] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-foreground transition-all duration-200 hover:bg-secondary hover:text-primary"
            >
              {link.label}
            </button>
          ))}

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <a
              href="/portal"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
            >
              Portal Login
            </a>

            <a
              href="tel:9755018656"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <Phone size={15} /> Call Clinic
            </a>

            <button
              onClick={() => handleNavClick("#appointment")}
              className="rounded-xl px-4 py-3 text-sm font-bold text-white sm:col-span-2"
              style={{ background: "var(--warm-orange)" }}
            >
              Book Appointment
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
