'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-6">
          <p className="text-[var(--text-secondary)]">
            Last updated: February 2024
          </p>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Introduction</h2>
            <p className="text-[var(--text-secondary)]">
              ApniGully ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              neighborhood community platform.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Information We Collect</h2>

            <h3 className="text-lg font-medium text-[var(--text-primary)] mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li>Phone number (required for account creation)</li>
              <li>Name and profile photo</li>
              <li>Email address (optional)</li>
              <li>Location data (with your permission)</li>
              <li>Neighborhood and building information</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--text-primary)] mt-4 mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li>Posts, comments, and messages you create</li>
              <li>Interactions with other users</li>
              <li>Device information and app usage patterns</li>
              <li>Push notification tokens</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li>To create and manage your account</li>
              <li>To connect you with your neighborhood community</li>
              <li>To facilitate communication between users</li>
              <li>To send notifications about community activity</li>
              <li>To calculate trust scores and verify users</li>
              <li>To improve our services and user experience</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Information Sharing</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li><strong>With other users:</strong> Your profile information and posts are visible to other members of your neighborhood based on your privacy settings</li>
              <li><strong>Service providers:</strong> We may share information with third-party services that help us operate the platform (cloud hosting, analytics)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights and safety</li>
            </ul>
            <p className="text-[var(--text-secondary)] mt-4">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Your Privacy Controls</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              You have control over your information through:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] space-y-2">
              <li><strong>Privacy Settings:</strong> Control who can see your profile and information</li>
              <li><strong>Notification Preferences:</strong> Choose what notifications you receive</li>
              <li><strong>Data Export:</strong> Request a copy of your data</li>
              <li><strong>Account Deletion:</strong> Delete your account and associated data</li>
              <li><strong>Blocking:</strong> Block users who you don't want to interact with</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Data Security</h2>
            <p className="text-[var(--text-secondary)]">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Encryption in transit and at rest</li>
              <li>Secure authentication with OTP verification</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and employee training</li>
            </ul>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Data Retention</h2>
            <p className="text-[var(--text-secondary)]">
              We retain your information for as long as your account is active or as needed to provide services.
              When you delete your account, we remove your personal information within 30 days, except where
              required by law to retain certain data.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Children's Privacy</h2>
            <p className="text-[var(--text-secondary)]">
              ApniGully is not intended for users under 18 years of age. We do not knowingly collect
              information from children under 18.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Changes to This Policy</h2>
            <p className="text-[var(--text-secondary)]">
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes through the app or by email.
            </p>
          </section>

          <section className="bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-color)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Contact Us</h2>
            <p className="text-[var(--text-secondary)]">
              For questions about this Privacy Policy or your data, contact us at:
            </p>
            <ul className="list-none mt-3 text-[var(--text-secondary)] space-y-2">
              <li>Email: privacy@apnigully.com</li>
              <li>Address: Mumbai, India</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <Link
            href="/terms"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
