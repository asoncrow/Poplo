import { ArrowRight, Check, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AuthModal from "../components/AuthModal";

import { useLocation, useNavigate } from "react-router-dom";

const notifications = [
  {
    title: "Jake from Austin just signed up",
    subtext: "2 minutes ago"
  },
  {
    title: "Someone just purchased the Growth plan",
    subtext: "just now"
  },
  {
    title: "34 people are viewing this page right now",
    subtext: "Live"
  }
];

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-cream text-charcoal font-sans selection:bg-terracotta selection:text-cream">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between relative z-50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
            <div className="w-3 h-3 bg-cream rounded-full"></div>
          </div>
          <span className="font-syne text-2xl tracking-tight mt-1">poplo</span>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal/80">
          <a href="#" className="hover:text-terracotta transition-colors min-h-[44px] flex items-center">How it works</a>
          <a href="#" className="hover:text-terracotta transition-colors min-h-[44px] flex items-center">Pricing</a>
          <a href="#" className="hover:text-terracotta transition-colors min-h-[44px] flex items-center">Docs</a>
        </div>

        {/* Right CTA & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-charcoal text-white px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium hover:bg-charcoal/90 transition-colors min-h-[44px]"
          >
            Start free
          </button>
          <button 
            className="md:hidden p-2 text-[#1C1917] min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-[72px] left-0 right-0 bg-[#FAF7F2] border-b border-sand shadow-lg z-40"
          >
            <div className="flex flex-col px-4 py-2">
              <a href="#" className="flex items-center h-[48px] font-medium text-charcoal hover:text-terracotta border-b border-sand/50">How it works</a>
              <a href="#" className="flex items-center h-[48px] font-medium text-charcoal hover:text-terracotta border-b border-sand/50">Pricing</a>
              <a href="#" className="flex items-center h-[48px] font-medium text-charcoal hover:text-terracotta">Docs</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center flex flex-col items-center">
        <h1 className="font-syne text-[32px] md:text-[40px] lg:text-[56px] leading-[1.1] tracking-tight max-w-4xl mx-auto text-charcoal mb-6 sm:mb-8">
          Your landing page looks empty to strangers.
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-charcoal/80 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
          Poplo shows real-time signups, purchases and activity so visitors feel the momentum — and convert. One script tag. Live in 5 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-terracotta text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-[#A84A23] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center min-h-[44px]"
          >
            Add to my site <ArrowRight className="w-5 h-5" />
          </button>
          <button className="bg-transparent border-2 border-charcoal text-charcoal px-8 py-4 rounded-full font-medium text-lg hover:bg-charcoal/5 transition-colors w-full sm:w-auto justify-center min-h-[44px]">
            See how it works
          </button>
        </div>

        <div className="flex items-center gap-3 text-[13px] text-muted font-medium">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <img 
                key={i}
                src={`https://picsum.photos/seed/founder${i}/64/64`}
                alt="Founder"
                className="w-6 h-6 rounded-full border-2 border-cream"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <span>47 founders added Poplo this week</span>
        </div>
      </main>

      {/* Live Preview Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <h2 className="font-syne font-bold text-[28px] sm:text-3xl md:text-4xl text-center mb-8 sm:mb-12 text-charcoal">
          This is what your visitors will see.
        </h2>

        {/* Mobile Static Notification */}
        <div className="md:hidden flex justify-center w-full">
          <div className="bg-white border border-sand rounded-[16px] p-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.05)] flex items-center gap-3 relative pr-10 w-full max-w-[320px]">
            {/* pulsing dot */}
            <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </div>
            
            {/* icon */}
            <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center flex-shrink-0 text-white">
              <div className="w-4 h-4 border-2 border-white/80 rounded-sm"></div>
            </div>
            
            {/* text */}
            <div className="flex flex-col text-left">
              <span className="font-sans font-semibold text-[13px] text-charcoal leading-tight">
                Jake from Austin just signed up
              </span>
              <span className="font-sans font-normal text-[11px] text-muted mt-0.5">
                2 minutes ago
              </span>
            </div>
          </div>
        </div>

        {/* Browser Mockup (Tablet/Desktop) */}
        <div className="hidden md:block w-full max-w-4xl mx-auto bg-white rounded-[20px] border border-sand shadow-sm overflow-hidden relative">
          {/* Browser Chrome */}
          <div className="bg-cream border-b border-sand px-4 py-3 flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E2D9C8]"></div>
              <div className="w-3 h-3 rounded-full bg-[#E2D9C8]"></div>
              <div className="w-3 h-3 rounded-full bg-[#E2D9C8]"></div>
            </div>
            <div className="bg-white border border-sand rounded-full h-7 flex-1 max-w-md mx-auto flex items-center px-4">
              <div className="w-32 h-2 bg-sand/50 rounded-full"></div>
            </div>
          </div>

          {/* Browser Content (Placeholder Landing Page) */}
          <div className="h-[450px] bg-white p-8 md:p-12 relative">
            <div className="max-w-2xl">
              <div className="w-24 h-6 bg-sand rounded-full mb-12"></div>
              <div className="w-3/4 h-12 bg-sand rounded-2xl mb-4"></div>
              <div className="w-1/2 h-12 bg-sand rounded-2xl mb-8"></div>
              <div className="w-64 h-4 bg-sand/60 rounded-full mb-3"></div>
              <div className="w-48 h-4 bg-sand/60 rounded-full mb-10"></div>
              <div className="w-40 h-12 bg-sand rounded-full"></div>
            </div>

            {/* Notification Overlay */}
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-white border border-sand rounded-[16px] p-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.05)] flex items-center gap-3 relative pr-10 min-w-[280px]"
                >
                  {/* pulsing dot */}
                  <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </div>
                  
                  {/* icon */}
                  <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center flex-shrink-0 text-white">
                    <div className="w-4 h-4 border-2 border-white/80 rounded-sm"></div>
                  </div>
                  
                  {/* text */}
                  <div className="flex flex-col text-left">
                    <span className="font-sans font-semibold text-[13px] text-charcoal leading-tight">
                      {notifications[currentIndex].title}
                    </span>
                    <span className="font-sans font-normal text-[11px] text-muted mt-0.5">
                      {notifications[currentIndex].subtext}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="font-syne font-bold text-[28px] sm:text-3xl md:text-4xl text-center mb-10 sm:mb-16 text-charcoal">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-sand rounded-[20px] p-7">
            <div className="font-syne font-extrabold text-5xl text-terracotta mb-6">1</div>
            <h3 className="font-syne font-bold text-xl text-charcoal mb-3">Paste one script tag</h3>
            <p className="font-sans text-muted leading-relaxed">
              Works on Webflow, Framer, Carrd, Wordpress, anything.
            </p>
          </div>
          {/* Step 2 */}
          <div className="bg-white border border-sand rounded-[20px] p-7">
            <div className="font-syne font-extrabold text-5xl text-terracotta mb-6">2</div>
            <h3 className="font-syne font-bold text-xl text-charcoal mb-3">Connect your data</h3>
            <p className="font-sans text-muted leading-relaxed">
              Stripe, webhook, or upload a CSV to start.
            </p>
          </div>
          {/* Step 3 */}
          <div className="bg-white border border-sand rounded-[20px] p-7">
            <div className="font-syne font-extrabold text-5xl text-terracotta mb-6">3</div>
            <h3 className="font-syne font-bold text-xl text-charcoal mb-3">Watch conversions move</h3>
            <p className="font-sans text-muted leading-relaxed">
              Live notification bubbles build trust on autopilot.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="font-syne font-bold text-[28px] sm:text-3xl md:text-4xl text-center mb-10 sm:mb-16 text-charcoal">
          Simple, transparent pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Starter */}
          <div className="border border-sand rounded-[20px] p-8">
            <h3 className="font-syne font-bold text-2xl text-charcoal mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-syne font-bold text-4xl text-charcoal">$9</span>
              <span className="font-sans text-muted">/mo</span>
            </div>
            <ul className="font-sans text-muted space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>1 domain</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Signup + pageview counters</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>3 notification styles</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>10k impressions/mo</span>
              </li>
            </ul>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 rounded-full border-2 border-charcoal text-charcoal font-medium hover:bg-charcoal/5 transition-colors min-h-[44px]"
            >
              Get started
            </button>
          </div>

          {/* Growth */}
          <div className="bg-white border border-sand rounded-[20px] p-8 relative border-t-[3px] border-t-terracotta shadow-lg mt-4 md:mt-0">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-terracotta text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Most popular
            </div>
            <h3 className="font-syne font-bold text-2xl text-charcoal mb-2">Growth</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-syne font-bold text-4xl text-charcoal">$19</span>
              <span className="font-sans text-muted">/mo</span>
            </div>
            <ul className="font-sans text-muted space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>3 domains</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>All signal types</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Branding removed</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>100k impressions/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Analytics dashboard</span>
              </li>
            </ul>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 rounded-full bg-terracotta text-white font-medium hover:bg-[#A84A23] transition-colors min-h-[44px]"
            >
              Get started
            </button>
          </div>

          {/* Pro */}
          <div className="border border-sand rounded-[20px] p-8">
            <h3 className="font-syne font-bold text-2xl text-charcoal mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-syne font-bold text-4xl text-charcoal">$39</span>
              <span className="font-sans text-muted">/mo</span>
            </div>
            <ul className="font-sans text-muted space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Unlimited domains</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>A/B test copy</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Webhook + Zapier</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>Unlimited impressions</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-terracotta flex-shrink-0" />
                <span>White-label</span>
              </li>
            </ul>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 rounded-full border-2 border-charcoal text-charcoal font-medium hover:bg-charcoal/5 transition-colors min-h-[44px]"
            >
              Get started
            </button>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
