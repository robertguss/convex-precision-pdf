import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Precision PDF",
  description: "Privacy Policy for Precision PDF - Learn how we collect, use, and protect your personal information",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="prose prose-gray max-w-none dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-950/30">
          <p className="text-sm">
            <strong>Our Commitment:</strong> At Precision PDF, we take your privacy seriously. This policy explains how we collect, 
            use, and protect your information when you use our AI-powered PDF extraction service.
          </p>
        </div>

        <h2>1. Information We Collect</h2>
        <p>We collect information to provide and improve our services. Here&apos;s what we gather:</p>
        
        <h3>1.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Your name, email address, and profile details when you create an account</li>
          <li><strong>Payment Information:</strong> Billing details processed securely through Stripe (we don&apos;t store credit card numbers)</li>
          <li><strong>Documents:</strong> PDF files you upload for processing</li>
          <li><strong>Communications:</strong> Messages you send to our support team</li>
        </ul>

        <h3>1.2 Information We Collect Automatically</h3>
        <ul>
          <li><strong>Usage Data:</strong> How you interact with our service, including features used and processing history</li>
          <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
          <li><strong>Log Data:</strong> IP addresses, access times, and pages viewed</li>
          <li><strong>Cookies:</strong> Session cookies and preferences (you can control these in your browser)</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information only for legitimate business purposes:</p>
        
        <h3>2.1 To Provide Our Services</h3>
        <ul>
          <li>Process your PDF documents using AI technology</li>
          <li>Store your processing history and extracted data</li>
          <li>Manage your account and subscription</li>
          <li>Send you important service updates</li>
        </ul>

        <h3>2.2 To Improve Our Services</h3>
        <ul>
          <li>Analyze usage patterns to enhance features</li>
          <li>Fix bugs and improve performance</li>
          <li>Develop new features based on user needs</li>
          <li>Ensure quality and accuracy of data extraction</li>
        </ul>

        <h3>2.3 To Communicate With You</h3>
        <ul>
          <li>Send transactional emails (welcome messages, payment confirmations)</li>
          <li>Notify you about your usage limits</li>
          <li>Respond to your support requests</li>
          <li>Send product updates (you can opt out)</li>
        </ul>

        <h2>3. How We Protect Your Data</h2>
        <p>
          Security is fundamental to our service. We implement industry-standard measures to protect your information:
        </p>
        
        <div className="my-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 font-semibold">🔒 Encryption</h4>
            <p className="text-sm">All data is encrypted in transit (TLS) and at rest (AES-256)</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 font-semibold">🛡️ Access Controls</h4>
            <p className="text-sm">Strict authentication and authorization for all systems</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 font-semibold">🔍 Monitoring</h4>
            <p className="text-sm">24/7 security monitoring and intrusion detection</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 font-semibold">✓ Compliance</h4>
            <p className="text-sm">SOC 2 Type I certified and HIPAA compliant infrastructure</p>
          </div>
        </div>

        <h2>4. Data Retention and Deletion</h2>
        <p>We retain your data only as long as necessary:</p>
        
        <h3>4.1 Temporary Document Storage</h3>
        <ul>
          <li><strong>Uploaded PDFs:</strong> Automatically deleted within 24 hours of processing</li>
          <li><strong>Extracted Data:</strong> Stored in your account until you delete it</li>
          <li><strong>Processing Cache:</strong> Cleared immediately after extraction completes</li>
        </ul>

        <h3>4.2 Account Data</h3>
        <ul>
          <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
          <li><strong>Deleted Accounts:</strong> Personal data removed within 30 days of account deletion</li>
          <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
        </ul>

        <h2>5. Third-Party Services</h2>
        <p>
          We work with trusted partners to provide our services. These partners have their own privacy policies 
          and are contractually required to protect your data:
        </p>
        
        <div className="my-6 space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="font-semibold">Authentication - Clerk</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manages user authentication and sessions securely
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="font-semibold">Payments - Stripe</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Processes payments with PCI-compliant security standards
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="font-semibold">Database - Convex</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stores your data with real-time synchronization and backups
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="font-semibold">AI Processing - Landing AI</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Powers our document extraction with advanced AI models
            </p>
          </div>
        </div>

        <h2>6. Your Privacy Rights</h2>
        <p>You have control over your personal information:</p>
        
        <h3>6.1 Access and Portability</h3>
        <ul>
          <li>Request a copy of all data we have about you</li>
          <li>Export your extracted data in various formats (JSON, CSV, etc.)</li>
          <li>Access your processing history and account details</li>
        </ul>

        <h3>6.2 Correction and Deletion</h3>
        <ul>
          <li>Update your account information at any time</li>
          <li>Delete specific documents or extracted data</li>
          <li>Request complete account deletion</li>
        </ul>

        <h3>6.3 Consent and Control</h3>
        <ul>
          <li>Opt out of marketing communications</li>
          <li>Control cookie preferences in your browser</li>
          <li>Disable specific features in your account settings</li>
        </ul>

        <h2>7. International Data Transfers</h2>
        <p>
          Our services are primarily hosted in the United States. If you&apos;re accessing our service from another country, 
          your information may be transferred to and processed in the US. We ensure appropriate safeguards are in place 
          for international transfers in compliance with applicable laws.
        </p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          Precision PDF is not intended for children under 13 years of age. We do not knowingly collect personal 
          information from children. If you believe we have inadvertently collected such information, please contact 
          us immediately.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
          We&apos;ll notify you of significant changes via email or through our service. The &ldquo;Last updated&rdquo; date 
          at the top shows when we last revised this policy.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or how we handle your data, we&apos;re here to help:
        </p>
        
        <div className="my-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold">Precision PDF Privacy Team</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> privacy@precisionpdf.com</p>
            <p><strong>Support:</strong> support@precisionpdf.com</p>
            <p><strong>Address:</strong> Precision PDF, Inc.<br />123 AI Boulevard<br />San Francisco, CA 94107</p>
          </div>
        </div>

        <h2>11. California Privacy Rights</h2>
        <p>
          California residents have additional rights under the California Consumer Privacy Act (CCPA):
        </p>
        <ul>
          <li>Right to know what personal information is collected</li>
          <li>Right to delete personal information</li>
          <li>Right to opt-out of the sale of personal information (we don&apos;t sell your data)</li>
          <li>Right to non-discrimination for exercising privacy rights</li>
        </ul>

        <h2>12. European Privacy Rights</h2>
        <p>
          If you&apos;re in the European Economic Area, you have rights under the General Data Protection Regulation (GDPR):
        </p>
        <ul>
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure (&ldquo;right to be forgotten&rdquo;)</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
          <li>Right to withdraw consent</li>
        </ul>

        <div className="mt-12 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Your Privacy Matters:</strong> We&apos;re committed to protecting your privacy and being transparent 
            about our practices. If you have any concerns or questions, don&apos;t hesitate to reach out. Thank you for 
            trusting Precision PDF with your document processing needs.
          </p>
        </div>
      </div>
    </div>
  );
}