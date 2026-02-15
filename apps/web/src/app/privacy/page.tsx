'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] animate-fade-in">
      {/* Gradient Header */}
      <div className="bg-[var(--gradient-hero)] px-4 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 press-scale-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </div>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-white/70 mt-2 text-sm">
            Last updated: February 2024
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-12">
        <div className="space-y-4">
          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Introduction</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              ApniGully ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              neighborhood community platform.
            </p>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Information We Collect</h2>

            <h3 className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li>Phone number (required for account creation)</li>
              <li>Name and profile photo</li>
              <li>Email address (optional)</li>
              <li>Location data (with your permission)</li>
              <li>Neighborhood and building information</li>
            </ul>

            <h3 className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2">Usage Information</h3>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li>Posts, comments, and messages you create</li>
              <li>Interactions with other users</li>
              <li>Device information and app usage patterns</li>
              <li>Push notification tokens</li>
            </ul>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li>To create and manage your account</li>
              <li>To connect you with your neighborhood community</li>
              <li>To facilitate communication between users</li>
              <li>To send notifications about community activity</li>
              <li>To calculate trust scores and verify users</li>
              <li>To improve our services and user experience</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Information Sharing</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">
              We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li><strong>With other users:</strong> Your profile information and posts are visible to other members of your neighborhood based on your privacy settings</li>
              <li><strong>Service providers:</strong> We may share information with third-party services that help us operate the platform (cloud hosting, analytics)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights and safety</li>
            </ul>
            <p className="text-[var(--text-secondary)] text-sm mt-4 font-semibold leading-relaxed">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Your Privacy Controls</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">
              You have control over your information through:
            </p>
            <ul className="list-disc pl-6 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li><strong>Privacy Settings:</strong> Control who can see your profile and information</li>
              <li><strong>Notification Preferences:</strong> Choose what notifications you receive</li>
              <li><strong>Data Export:</strong> Request a copy of your data</li>
              <li><strong>Account Deletion:</strong> Delete your account and associated data</li>
              <li><strong>Blocking:</strong> Block users who you don't want to interact with</li>
            </ul>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Data Security</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mt-3 text-[var(--text-secondary)] text-sm space-y-2 leading-relaxed">
              <li>Encryption in transit and at rest</li>
              <li>Secure authentication with OTP verification</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and employee training</li>
            </ul>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Data Retention</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services.
              When you delete your account, we remove your personal information within 30 days, except where
              required by law to retain certain data.
            </p>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Children's Privacy</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              ApniGully is not intended for users under 18 years of age. We do not knowingly collect
              information from children under 18.
            </p>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Changes to This Policy</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes through the app or by email.
            </p>
          </section>

          <section className="card shadow-card p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Contact Us</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              For questions about this Privacy Policy or your data, contact us at:
            </p>
            <ul className="list-none mt-3 text-[var(--text-secondary)] text-sm space-y-2">
              <li>Email: privacy@apnigully.com</li>
              <li>Address: Mumbai, India</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-color-light)]">
          <Link
            href="/terms"
            className="text-primary-500 hover:text-primary-600 font-semibold press-scale-sm"
          >
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
