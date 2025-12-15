/**
 * PrivacyPolicy.tsx
 * Ready for custom content
 */

import React from "react";
import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            This Privacy & Cookie Policy explains how TRUE NESTER ("we", "our", "us")
            collects, uses, and protects personal information when you use our website and services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Contact details such as name, email, and phone</li>
            <li>Property preferences, budget, and inquiries</li>
            <li>Technical data such as IP, device, and browser</li>
            <li>Usage data like pages visited and referral sources</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">How We Use Information</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Respond to inquiries and provide property details</li>
            <li>Improve our website and services</li>
            <li>Communicate updates, promotions, and insights</li>
            <li>Comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Cookies</h2>
          <p className="text-gray-700 leading-relaxed">
            We use essential, analytics, and marketing cookies to improve functionality and performance.
            You can manage cookies via your browser settings; disabling cookies may affect site features.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Data Sharing</h2>
          <p className="text-gray-700 leading-relaxed">
            We may share data with trusted partners (e.g., hosting, analytics, CRM) and authorized
            real estate partners where necessary. We do not sell personal data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p className="text-gray-700 leading-relaxed">
            You may request access, correction, deletion, or opt-out of marketing. Contact us using the
            details below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            For privacy questions, contact info@truenester.com <br />
            TRUE NESTER,<br />
             206 Bin Sougat building, Salah Al Din street, Deira, <br />
             Dubai, UAE
          </p>
        </section>
      </div>
    </Layout>
  );
}
