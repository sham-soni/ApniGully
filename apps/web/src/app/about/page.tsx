import Link from 'next/link';
import { MapPin, Heart, Shield, Users, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">ApniGully</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Building trusted micro-communities for Indian neighborhoods
          </p>
          <p className="text-sm text-primary-200 mt-4">Version 1.0.0</p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Our Mission</h2>
        <p className="text-neutral-600 text-lg leading-relaxed mb-8">
          ApniGully (meaning "Our Street" in Hindi) is dedicated to reviving the spirit of
          close-knit Indian neighborhoods in the digital age. We believe that strong local
          communities are the foundation of a thriving society.
        </p>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-neutral-50 rounded-xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Trust & Safety</h3>
            <p className="text-sm text-neutral-600">
              Phone verification and community endorsements ensure you're connecting with real neighbors.
            </p>
          </div>
          <div className="p-6 bg-neutral-50 rounded-xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Local First</h3>
            <p className="text-sm text-neutral-600">
              Everything happens within your neighborhood - helpers, shops, recommendations, and more.
            </p>
          </div>
          <div className="p-6 bg-neutral-50 rounded-xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Community Care</h3>
            <p className="text-sm text-neutral-600">
              Safety alerts, check-ins, and mutual help make neighborhoods safer and stronger.
            </p>
          </div>
        </div>

        {/* Features */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">What You Can Do</h2>
        <ul className="space-y-3 text-neutral-600 mb-12">
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            Share updates, recommendations, and safety alerts with neighbors
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            Find trusted helpers - maids, cooks, drivers, electricians, and more
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            Discover local shops and exclusive neighborhood deals
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            List and find rentals in your area with verified landlords
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            Chat directly with neighbors, helpers, and shop owners
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold">-</span>
            Join interest-based micro-groups within your neighborhood
          </li>
        </ul>

        {/* Links */}
        <div className="border-t border-neutral-200 pt-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Legal & Support</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              Terms of Service
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              Privacy Policy
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              Help Center
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 p-6 bg-neutral-50 rounded-xl">
          <h3 className="font-semibold text-neutral-900 mb-2">Contact Us</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Have questions or feedback? We'd love to hear from you.
          </p>
          <a
            href="mailto:support@apnigully.com"
            className="text-primary-600 font-medium hover:underline"
          >
            support@apnigully.com
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 mt-12">
          <p>Made with care for Indian neighborhoods</p>
          <p className="mt-1">2024 ApniGully. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
