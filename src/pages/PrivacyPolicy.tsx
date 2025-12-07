/**
 * PrivacyPolicy.tsx
 * 
 * Privacy Policy page for Dubai Nest Hub
 * Explains cookie usage and user rights under UAE PDPL
 * 
 * To activate:
 * 1. Add this import to App.tsx:
 *    import PrivacyPolicy from "./pages/PrivacyPolicy";
 * 
 * 2. Add this route to App.tsx (before the catch-all * route):
 *    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
 * 
 * 3. Update CookieBanner.tsx link href:
 *    <a href="/privacy-policy" ...>
 */

import React from "react";
import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">
          Last updated: December 2025
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Dubai Nest Hub ("we", "us", "our", or "Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Please read this Privacy Policy carefully. By accessing and using Dubai Nest Hub, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">2. Cookie & Consent Management</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 What Are Cookies?</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small files stored on your device when you visit our website. They help us remember your preferences and understand how you use our site.
          </p>

          <h3 className="text-xl font-semibold mb-2">2.2 Types of Cookies We Use</h3>
          <div className="bg-gray-50 border-l-4 border-blue-600 p-4 mb-4">
            <h4 className="font-semibold mb-2">Essential Cookies (No Consent Required)</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Session management for form submissions</li>
              <li>Authentication tokens for secure functionality</li>
              <li>Chat/conversation session IDs for continuity</li>
              <li>Basic security and fraud prevention</li>
            </ul>
          </div>

          <div className="bg-gray-50 border-l-4 border-orange-600 p-4 mb-4">
            <h4 className="font-semibold mb-2">Analytics Cookies (Requires "Accept All" Consent)</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Page view tracking</li>
              <li>User behavior analysis</li>
              <li>Traffic source identification</li>
              <li>Performance monitoring</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-2">2.3 Your Consent Choice</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you visit Dubai Nest Hub for the first time, you will see a consent banner at the bottom of the screen. You can choose one of three options:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Accept All:</strong> Allows both essential and analytics cookies for 12 months</li>
            <li><strong>Essential Only:</strong> Uses only essential cookies; analytics are blocked</li>
            <li><strong>Reject:</strong> Blocks all non-essential cookies</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Consent Duration</h3>
          <p className="text-gray-700 leading-relaxed">
            Your consent choice is stored for <strong>12 months</strong>. After 12 months, we will ask for your consent again. You can change your preference at any time by clearing your browser's localStorage or contacting us.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">3. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-2">3.1 Essential Information</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you use our forms (contact, property inquiry), we collect:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Name, email address, phone number</li>
            <li>Message content and property preferences</li>
            <li>IP address (for security and abuse prevention)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Chat Data</h3>
          <p className="text-gray-700 leading-relaxed">
            Our chatbot captures lead information to help our sales team follow up. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Chat messages and conversation history</li>
            <li>Property type, budget, and location preferences</li>
            <li>Session ID (for conversation continuity)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Analytics Data (Only With "Accept All" Consent)</h3>
          <p className="text-gray-700 leading-relaxed">
            If you accept analytics cookies, we may collect:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Pages visited and time spent on site</li>
            <li>Referral source (how you found us)</li>
            <li>Device type and browser information</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">4. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Essential Use:</strong> Process inquiries, provide services, prevent fraud</li>
            <li><strong>Lead Management:</strong> Follow up on property inquiries and leads</li>
            <li><strong>Analytics:</strong> Understand user behavior and improve our website</li>
            <li><strong>Communication:</strong> Respond to your questions and requests</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. Your Rights Under PDPL</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Under the UAE Data Protection Law (PDPL), you have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Access:</strong> Request what personal data we hold about you</li>
            <li><strong>Correction:</strong> Ask us to update or correct your information</li>
            <li><strong>Deletion:</strong> Request deletion of your data (where legally permitted)</li>
            <li><strong>Opt-Out:</strong> Withdraw consent for analytics at any time</li>
            <li><strong>No Discrimination:</strong> We won't penalize you for exercising your rights</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Third-Party Services</h2>
          <h3 className="text-xl font-semibold mb-2">6.1 Supabase (Database)</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use Supabase for secure data storage. Supabase implements industry-standard security and privacy practices.
          </p>

          <h3 className="text-xl font-semibold mb-2">6.2 Slack (Notifications)</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you submit a form or inquiry, we may send a notification to our team via Slack. Only aggregated lead information is shared.
          </p>

          <h3 className="text-xl font-semibold mb-2">6.3 Analytics Services</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may use privacy-friendly analytics services (e.g., Plausible, Umami) that respect user privacy and do not use cookies for tracking. These require explicit consent.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We take data security seriously and implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have questions about this Privacy Policy, your personal data, or wish to exercise your rights under PDPL, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700"><strong>Email:</strong> privacy@dubainesthouse.com</p>
            <p className="text-gray-700"><strong>Address:</strong> Dubai, United Arab Emirates</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will notify you by updating the "Last updated" date at the top of this page. Your continued use of Dubai Nest Hub after any changes constitutes your acceptance of the updated Privacy Policy.
          </p>
        </section>
      </div>
    </Layout>
  );
}
