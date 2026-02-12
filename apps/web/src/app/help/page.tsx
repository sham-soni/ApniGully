'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Search, MessageCircle, Shield, Users, Home, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: any;
  faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    faqs: [
      {
        question: 'How do I create an account?',
        answer: 'Simply enter your phone number on the login page. You will receive an OTP (One Time Password) via SMS. Enter the OTP to verify your number and create your account. No password needed!',
      },
      {
        question: 'How do I join a neighborhood?',
        answer: 'You can join a neighborhood in three ways: 1) Search for your neighborhood by name or pincode, 2) Use an invite code shared by a neighbor, or 3) Create a new neighborhood if yours doesn\'t exist yet.',
      },
      {
        question: 'What is a Trust Score?',
        answer: 'Your Trust Score reflects your credibility in the community. It increases when you: get your phone verified, receive endorsements from neighbors, get positive reviews, and maintain good standing. Higher trust scores help others feel confident interacting with you.',
      },
    ],
  },
  {
    id: 'posts-interactions',
    title: 'Posts & Interactions',
    icon: MessageCircle,
    faqs: [
      {
        question: 'What types of posts can I create?',
        answer: 'You can create several types of posts: Updates (general information), Safety Alerts (emergencies or security concerns), Recommendations (suggesting services/places), Requests (asking for help), Rentals (property listings), and Buy/Sell posts.',
      },
      {
        question: 'How do I report inappropriate content?',
        answer: 'Tap the three dots (...) on any post, comment, or message and select "Report". Choose the reason for reporting and add any additional details. Our moderators will review the report within 24 hours.',
      },
      {
        question: 'Can I edit or delete my posts?',
        answer: 'Yes! Tap the three dots on your post and select Edit or Delete. Note that edited posts will show an "Edited" label, and deleted posts cannot be recovered.',
      },
    ],
  },
  {
    id: 'helpers-services',
    title: 'Helpers & Services',
    icon: Users,
    faqs: [
      {
        question: 'How do I find a helper?',
        answer: 'Go to the Discover tab and select "Helpers". You can filter by skill type (maid, cook, driver, etc.), availability, and rating. Each helper profile shows their experience, languages, pricing, and reviews from other neighbors.',
      },
      {
        question: 'How do reviews work for helpers?',
        answer: 'Reviews are linked to completed tasks. When you book a helper and mark the task as complete, you can leave a verified review. This ensures all reviews come from actual service experiences.',
      },
      {
        question: 'Can I become a helper on ApniGully?',
        answer: 'Yes! Go to your Profile settings and select "Become a Helper". Fill in your skills, experience, availability, and pricing. Once approved, you\'ll appear in the helpers directory for your neighborhood.',
      },
    ],
  },
  {
    id: 'rentals',
    title: 'Rentals',
    icon: Home,
    faqs: [
      {
        question: 'How do I list a rental property?',
        answer: 'Create a new post and select "Rental" as the type. Describe your property including BHK, rent, deposit, and amenities. Our smart parser will automatically detect and organize these details for potential tenants.',
      },
      {
        question: 'How do I contact a property owner?',
        answer: 'On any rental listing, click "Contact Owner" to start a chat. You can also schedule a visit directly through the app.',
      },
      {
        question: 'Are rental listings verified?',
        answer: 'Listings from verified residents show a verification badge. We recommend always scheduling visits and verifying property ownership before making any payments.',
      },
    ],
  },
  {
    id: 'safety-security',
    title: 'Safety & Security',
    icon: Shield,
    faqs: [
      {
        question: 'What should I do in an emergency?',
        answer: 'For immediate emergencies, always call local emergency services first (Police: 100, Ambulance: 102, Fire: 101). You can also create a Safety Alert on ApniGully to notify your neighbors.',
      },
      {
        question: 'How do Safety Check-ins work?',
        answer: 'When a Safety Alert is posted in your neighborhood, you can mark yourself as "Safe" or "Need Help". This helps neighbors account for everyone during emergencies.',
      },
      {
        question: 'How do I block someone?',
        answer: 'Go to the person\'s profile, tap the three dots, and select "Block". Blocked users cannot see your posts, message you, or interact with your content.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! We use industry-standard encryption for all data transmission. Your phone number is verified but only shared based on your privacy settings. We never sell your personal information.',
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0 || !searchQuery);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900">Help Center</h1>
          <p className="text-neutral-600 mt-2">
            Find answers to common questions about ApniGully
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-neutral-900 mb-2">No results found</h3>
            <p className="text-sm text-neutral-500">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                  className="w-full flex items-center justify-between p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="font-semibold text-neutral-900">{category.title}</h2>
                      <p className="text-sm text-neutral-500">{category.faqs.length} questions</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-400 transition-transform ${
                      expandedCategory === category.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* FAQs */}
                {expandedCategory === category.id && (
                  <div className="border-t border-neutral-100">
                    {category.faqs.map((faq, index) => {
                      const faqId = `${category.id}-${index}`;
                      return (
                        <div key={index} className="border-b border-neutral-100 last:border-0">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50"
                          >
                            <span className="font-medium text-neutral-900 pr-4">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${
                                expandedFaq === faqId ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedFaq === faqId && (
                            <div className="px-4 pb-4">
                              <p className="text-neutral-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-8 p-6 bg-primary-50 rounded-xl text-center">
          <h3 className="font-semibold text-primary-900 mb-2">
            Still need help?
          </h3>
          <p className="text-sm text-primary-700 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@apnigully.com"
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
