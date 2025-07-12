import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service - Precision PDF",
	description:
		"Terms of Service for Precision PDF - AI-powered PDF data extraction service",
};

export default function TermsOfService() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-16">
			<div className="prose prose-gray max-w-none dark:prose-invert">
				<h1>Terms of Service</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Last updated:{" "}
					{new Date().toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>

				<h2>1. Acceptance of Terms</h2>
				<p>
					By accessing and using Precision PDF (&ldquo;Service&rdquo;), you
					agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If
					you do not agree to these Terms, please do not use our Service. We
					reserve the right to update these Terms at any time, and your
					continued use of the Service constitutes acceptance of any changes.
				</p>

				<h2>2. Description of Service</h2>
				<p>
					Precision PDF provides AI-powered PDF data extraction services that
					allow users to upload PDF documents and extract structured data. The
					Service includes various features such as table extraction, form field
					recognition, and data export in multiple formats. We offer both free
					and paid subscription plans with different usage limits and features.
				</p>

				<h2>3. User Accounts</h2>
				<h3>3.1 Account Creation</h3>
				<p>
					To use certain features of our Service, you must create an account.
					You agree to provide accurate, current, and complete information
					during registration and to update such information to keep it
					accurate, current, and complete.
				</p>
				<h3>3.2 Account Security</h3>
				<p>
					You are responsible for maintaining the security of your account
					credentials and for all activities that occur under your account. You
					must notify us immediately of any unauthorized access to or use of
					your account.
				</p>
				<h3>3.3 Account Termination</h3>
				<p>
					We reserve the right to suspend or terminate your account at any time
					for violations of these Terms or for any other reason at our sole
					discretion.
				</p>

				<h2>4. Payment Terms</h2>
				<h3>4.1 Subscription Plans</h3>
				<p>
					Paid subscriptions are billed monthly via our payment processor,
					Stripe. By subscribing to a paid plan, you authorize us to charge your
					payment method on a recurring basis.
				</p>
				<h3>4.2 Pricing</h3>
				<ul>
					<li>
						<strong>Free Plan:</strong> $0/month - 10 pages per month
					</li>
					<li>
						<strong>Starter Plan:</strong> $9.99/month - 75 pages per month
					</li>
					<li>
						<strong>Pro Plan:</strong> $24.99/month - 250 pages per month
					</li>
				</ul>
				<h3>4.3 Billing</h3>
				<p>
					Subscription fees are billed in advance on a monthly basis and are
					non-refundable except as required by law. You may cancel your
					subscription at any time, and cancellation will take effect at the end
					of the current billing period.
				</p>
				<h3>4.4 Price Changes</h3>
				<p>
					We reserve the right to change our pricing at any time. We will
					provide you with at least 30 days&apos; notice of any price increases
					affecting your subscription.
				</p>

				<h2>5. Usage Limits and Restrictions</h2>
				<h3>5.1 Page Limits</h3>
				<p>
					Each subscription plan includes a specific number of pages that can be
					processed per month. Unused pages do not roll over to the next month.
					If you exceed your monthly limit, you will need to upgrade your plan
					or wait until the next billing cycle.
				</p>
				<h3>5.2 Fair Use</h3>
				<p>
					Our Service is intended for legitimate business and personal use.
					Excessive use that impacts service performance for other users may
					result in usage restrictions or account termination.
				</p>
				<h3>5.3 Prohibited Uses</h3>
				<p>You agree not to:</p>
				<ul>
					<li>
						Use the Service for any illegal purposes or in violation of any laws
					</li>
					<li>
						Upload malicious files or content that could harm our systems or
						other users
					</li>
					<li>
						Attempt to reverse engineer, decompile, or disassemble the Service
					</li>
					<li>
						Resell, redistribute, or sublicense the Service without our written
						permission
					</li>
					<li>
						Use automated scripts or bots to access the Service except through
						our official API
					</li>
					<li>Upload content that infringes on intellectual property rights</li>
					<li>
						Use the Service to process sensitive personal data without proper
						authorization
					</li>
				</ul>

				<h2>6. Data Privacy and Security</h2>
				<h3>6.1 Data Processing</h3>
				<p>
					We process your documents securely using industry-standard encryption.
					Uploaded documents are temporarily stored for processing and are
					automatically deleted within 24 hours unless you choose to save them
					in your account.
				</p>
				<h3>6.2 Data Ownership</h3>
				<p>
					You retain all rights to the documents and data you upload to our
					Service. We do not claim any ownership rights to your content.
				</p>
				<h3>6.3 Privacy Policy</h3>
				<p>
					Your use of our Service is also governed by our Privacy Policy, which
					describes how we collect, use, and protect your personal information.
				</p>

				<h2>7. Intellectual Property</h2>
				<h3>7.1 Our Property</h3>
				<p>
					The Service, including all software, designs, text, images, and other
					content, is owned by us or our licensors and is protected by
					intellectual property laws. You may not copy, modify, distribute, or
					create derivative works based on our Service without our written
					permission.
				</p>
				<h3>7.2 Your Content</h3>
				<p>
					By uploading content to our Service, you grant us a limited,
					non-exclusive license to process and display your content solely for
					the purpose of providing the Service to you.
				</p>

				<h2>8. Disclaimers and Limitations of Liability</h2>
				<h3>8.1 Service Availability</h3>
				<p>
					We strive to maintain high availability, but we do not guarantee that
					the Service will be available at all times. We may experience downtime
					for maintenance, updates, or unforeseen circumstances.
				</p>
				<h3>8.2 Accuracy of Results</h3>
				<p>
					While we use advanced AI technology to extract data from PDFs, we do
					not guarantee 100% accuracy. You should review and verify all
					extracted data before using it for critical purposes.
				</p>
				<h3>8.3 Limitation of Liability</h3>
				<p>
					TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
					INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
					ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
					INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
					LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
				</p>
				<h3>8.4 Indemnification</h3>
				<p>
					You agree to indemnify and hold us harmless from any claims, damages,
					or expenses arising from your use of the Service or violation of these
					Terms.
				</p>

				<h2>9. Third-Party Services</h2>
				<p>
					Our Service integrates with third-party services including but not
					limited to:
				</p>
				<ul>
					<li>Clerk (Authentication)</li>
					<li>Stripe (Payment Processing)</li>
					<li>Convex (Database and Backend)</li>
					<li>Landing AI (Document Processing)</li>
				</ul>
				<p>
					Your use of these third-party services may be subject to their
					respective terms of service and privacy policies.
				</p>

				<h2>10. Governing Law and Dispute Resolution</h2>
				<h3>10.1 Governing Law</h3>
				<p>
					These Terms shall be governed by and construed in accordance with the
					laws of the United States and the State of Delaware, without regard to
					its conflict of law provisions.
				</p>
				<h3>10.2 Dispute Resolution</h3>
				<p>
					Any disputes arising out of or relating to these Terms or the Service
					shall be resolved through binding arbitration in accordance with the
					rules of the American Arbitration Association. The arbitration shall
					be conducted in Delaware, and judgment on the award may be entered in
					any court having jurisdiction.
				</p>

				<h2>11. General Provisions</h2>
				<h3>11.1 Entire Agreement</h3>
				<p>
					These Terms constitute the entire agreement between you and us
					regarding the use of the Service and supersede all prior agreements
					and understandings.
				</p>
				<h3>11.2 Severability</h3>
				<p>
					If any provision of these Terms is found to be unenforceable, the
					remaining provisions shall continue in full force and effect.
				</p>
				<h3>11.3 Waiver</h3>
				<p>
					Our failure to enforce any right or provision of these Terms shall not
					be considered a waiver of those rights.
				</p>
				<h3>11.4 Assignment</h3>
				<p>
					You may not assign or transfer these Terms or your rights under them
					without our prior written consent. We may assign our rights and
					obligations under these Terms without restriction.
				</p>

				<h2>12. Contact Information</h2>
				<p>
					If you have any questions about these Terms of Service, please contact
					us at:
				</p>
				<p>
					<strong>Precision PDF</strong>
					<br />
					Email: legal@precisionpdf.com
					<br />
					Support: support@precisionpdf.com
				</p>
				<p>
					For general inquiries or support issues, you can also reach us through
					the chat widget on our website or visit our help center.
				</p>

				<div className="mt-12 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
					<p className="text-sm text-gray-600 dark:text-gray-400">
						By using Precision PDF, you acknowledge that you have read,
						understood, and agree to be bound by these Terms of Service. Thank
						you for choosing Precision PDF for your document processing needs.
					</p>
				</div>
			</div>
		</div>
	);
}
