import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Kitify",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link href="/">
            <img
              src="/kitify-logo-dark.svg"
              alt="Kitify"
              className="h-7 w-auto"
            />
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">
          Last updated: 18 April 2025
        </p>

        <div className="mt-10 space-y-8 text-sm text-gray-700 leading-relaxed">
          <Section title="1. Introduction">
            <p>
              Kitify (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting and
              respecting your privacy. This Privacy Policy explains how we collect,
              use, store and share your personal data when you use our platform at
              kitify.co (the &quot;Service&quot;).
            </p>
            <p>
              We process personal data in accordance with the UK General Data
              Protection Regulation (UK GDPR), the Data Protection Act 2018, and
              the EU General Data Protection Regulation (EU GDPR) where applicable.
            </p>
          </Section>

          <Section title="2. Data controller">
            <p>
              The data controller responsible for your personal data is Kitify Ltd.
              If you have any questions about this policy or your data, please
              contact us at{" "}
              <a
                href="mailto:privacy@kitify.co"
                className="text-red-600 hover:text-red-500 transition-colors"
              >
                privacy@kitify.co
              </a>
              .
            </p>
          </Section>

          <Section title="3. What data we collect">
            <p>We may collect and process the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Account information:</strong> name, email address, and
                password (hashed) when you create an account.
              </li>
              <li>
                <strong>Company information:</strong> company name and business
                address provided during registration.
              </li>
              <li>
                <strong>Delivery information:</strong> recipient name, postal
                address, city, county, postcode, and country for order fulfilment.
              </li>
              <li>
                <strong>Order data:</strong> details of the kits and products you
                order, including selections, quantities, and pricing.
              </li>
              <li>
                <strong>Usage data:</strong> information about how you interact with
                our Service, including IP address, browser type, pages visited, and
                timestamps.
              </li>
              <li>
                <strong>Communication data:</strong> any messages or feedback you
                send to us.
              </li>
            </ul>
          </Section>

          <Section title="4. How we use your data">
            <p>
              We use your personal data only for the purposes set out below, and
              only where we have a lawful basis under UK GDPR / EU GDPR:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Performance of a contract:</strong> to create and manage
                your account, process orders, arrange delivery, and provide customer
                support.
              </li>
              <li>
                <strong>Legitimate interests:</strong> to improve and secure our
                Service, analyse usage patterns, and prevent fraud.
              </li>
              <li>
                <strong>Legal obligation:</strong> to comply with applicable laws,
                regulations, and legal processes.
              </li>
              <li>
                <strong>Consent:</strong> where you have opted in, to send you
                marketing communications. You can withdraw consent at any time.
              </li>
            </ul>
          </Section>

          <Section title="5. Data sharing">
            <p>
              We do not sell your personal data. We may share your data with the
              following categories of recipients:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Service providers:</strong> hosting, payment processing,
                shipping, and email delivery partners who process data on our behalf
                under appropriate data processing agreements.
              </li>
              <li>
                <strong>Your employer or company:</strong> if you use the Service
                through a company account, the company administrator may see
                order-related data such as your name and delivery address.
              </li>
              <li>
                <strong>Legal authorities:</strong> where required by law or to
                protect our legal rights.
              </li>
            </ul>
          </Section>

          <Section title="6. International transfers">
            <p>
              Your data may be transferred to and processed in countries outside the
              UK and EEA. Where this occurs, we ensure appropriate safeguards are in
              place, such as Standard Contractual Clauses (SCCs) approved by the UK
              Information Commissioner&apos;s Office (ICO) and the European Commission,
              or an adequacy decision.
            </p>
          </Section>

          <Section title="7. Data retention">
            <p>
              We retain your personal data only for as long as necessary to fulfil
              the purposes for which it was collected, including to satisfy legal,
              accounting, or reporting requirements. Account data is retained for the
              lifetime of your account and for up to 12 months after deletion.
              Order records are retained for 7 years for tax and accounting purposes.
            </p>
          </Section>

          <Section title="8. Your rights">
            <p>
              Under UK GDPR and EU GDPR, you have the following rights regarding
              your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Access:</strong> request a copy of the personal data we hold
                about you.
              </li>
              <li>
                <strong>Rectification:</strong> request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong>Erasure:</strong> request deletion of your personal data
                where there is no compelling reason for continued processing.
              </li>
              <li>
                <strong>Restriction:</strong> request restriction of processing in
                certain circumstances.
              </li>
              <li>
                <strong>Data portability:</strong> receive your data in a structured,
                commonly used, machine-readable format.
              </li>
              <li>
                <strong>Objection:</strong> object to processing based on legitimate
                interests or for direct marketing purposes.
              </li>
              <li>
                <strong>Withdraw consent:</strong> where processing is based on
                consent, withdraw it at any time without affecting the lawfulness of
                prior processing.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:privacy@kitify.co"
                className="text-red-600 hover:text-red-500 transition-colors"
              >
                privacy@kitify.co
              </a>
              . We will respond within one month.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              We use essential cookies that are strictly necessary for the operation
              of our Service (such as authentication and session management). These
              cookies do not require consent under UK and EU cookie regulations. We
              do not use advertising or tracking cookies.
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We implement appropriate technical and organisational measures to
              protect your personal data against unauthorised access, alteration,
              disclosure, or destruction. These include encryption in transit
              (TLS/SSL), hashed passwords, and access controls. However, no method
              of transmission or storage is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </Section>

          <Section title="11. Children">
            <p>
              Our Service is not directed at individuals under the age of 18. We do
              not knowingly collect personal data from children. If you believe we
              have collected data from a child, please contact us and we will
              promptly delete it.
            </p>
          </Section>

          <Section title="12. Complaints">
            <p>
              If you are unhappy with how we handle your personal data, you have the
              right to lodge a complaint with the UK Information Commissioner&apos;s
              Office (ICO) at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-500 transition-colors"
              >
                ico.org.uk
              </a>{" "}
              or, if applicable, your local EU supervisory authority.
            </p>
          </Section>

          <Section title="13. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. Any changes will
              be posted on this page with an updated revision date. We encourage you
              to review this page periodically.
            </p>
          </Section>

          <Section title="14. Contact us">
            <p>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Kitify Ltd</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@kitify.co"
                className="text-red-600 hover:text-red-500 transition-colors"
              >
                privacy@kitify.co
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
