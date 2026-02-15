import Link from 'next/link';
import { MapPin, Heart, Shield, Users, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--glass-border)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">ApniGully</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Building trusted micro-communities for Indian neighborhoods
          </p>
          <p className="text-sm text-white/50 mt-4">Version 1.0.0</p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-slide-up">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Our Mission</h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8">
            ApniGully (meaning "Our Street" in Hindi) is dedicated to reviving the spirit of
            close-knit Indian neighborhoods in the digital age. We believe that strong local
            communities are the foundation of a thriving society.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Trust & Safety</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Phone verification and community endorsements ensure you're connecting with real neighbors.
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Local First</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Everything happens within your neighborhood - helpers, shops, recommendations, and more.
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Community Care</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Safety alerts, check-ins, and mutual help make neighborhoods safer and stronger.
            </p>
          </div>
        </div>

        {/* Features */}
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">What You Can Do</h2>
        <div className="card p-6 mb-12">
          <ul className="space-y-4 text-[var(--text-secondary)]">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
              Share updates, recommendations, and safety alerts with neighbors
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary-500 mt-2 flex-shrink-0" />
              Find trusted helpers - maids, cooks, drivers, electricians, and more
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
              Discover local shops and exclusive neighborhood deals
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
              List and find rentals in your area with verified landlords
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary-500 mt-2 flex-shrink-0" />
              Chat directly with neighbors, helpers, and shop owners
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
              Join interest-based micro-groups within your neighborhood
            </li>
          </ul>
        </div>

        {/* Links */}
        <div className="border-t border-[var(--border-color-light)] pt-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Legal & Support</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium press-scale-sm transition-colors"
            >
              Terms of Service
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium press-scale-sm transition-colors"
            >
              Privacy Policy
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium press-scale-sm transition-colors"
            >
              Help Center
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 card p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Contact Us</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Have questions or feedback? We'd love to hear from you.
          </p>
          <a
            href="mailto:support@apnigully.com"
            className="btn btn-primary inline-flex items-center gap-2 press-scale-sm"
          >
            support@apnigully.com
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[var(--text-muted)] mt-12">
          <p>Made with care for Indian neighborhoods</p>
          <p className="mt-1">2024 ApniGully. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
