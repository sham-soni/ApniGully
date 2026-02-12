'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Terms of Service</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <p className="text-[var(--text-secondary)]">
            Last updated: February 2024
          </p>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">1. Acceptance of Terms</h2>
            <p className="text-[var(--text-secondary)]">
              By accessing or using ApniGully ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">2. Description of Service</h2>
            <p className="text-[var(--text-secondary)]">
              ApniGully is a neighborhood community platform that connects residents with their neighbors,
              local helpers, shops, and services. The Service includes features such as:
            </p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Community posts and discussions</li>
              <li>Helper and service provider listings</li>
              <li>Rental listings</li>
              <li>Direct messaging between users</li>
              <li>Safety alerts and check-ins</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">3. User Accounts</h2>
            <p className="text-[var(--text-secondary)]">
              To use the Service, you must register using a valid phone number. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and current information</li>
              <li>Notifying us of any unauthorized use</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">4. User Conduct</h2>
            <p className="text-[var(--text-secondary)]">You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Spam or send unsolicited messages</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorized access to the Service</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">5. Content Ownership</h2>
            <p className="text-[var(--text-secondary)]">
              You retain ownership of content you post on ApniGully. By posting content, you grant us a
              non-exclusive, royalty-free license to use, display, and distribute your content within the Service.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">6. Trust Score System</h2>
            <p className="text-[var(--text-secondary)]">
              ApniGully uses a trust score system to help users identify reliable community members.
              Trust scores are calculated based on verification status, endorsements, reviews, and community behavior.
              Manipulation of the trust score system is prohibited.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">7. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)]">
              ApniGully is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Actions or content of other users</li>
              <li>Quality of services provided by helpers or shops</li>
              <li>Disputes between users</li>
              <li>Any indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">8. Termination</h2>
            <p className="text-[var(--text-secondary)]">
              We reserve the right to suspend or terminate your account at any time for violations of these terms.
              You may also delete your account at any time through the Settings page.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">9. Changes to Terms</h2>
            <p className="text-[var(--text-secondary)]">
              We may update these terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">10. Contact</h2>
            <p className="text-[var(--text-secondary)]">
              For questions about these Terms, please contact us at legal@apnigully.com
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <Link
            href="/privacy"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
