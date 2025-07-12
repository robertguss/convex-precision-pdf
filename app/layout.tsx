import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		template: "%s | Precision PDF - AI-Powered PDF Data Extraction",
		default:
			"Precision PDF - Extract Data from PDFs with AI & Visual Verification",
	},
	description:
		"What used to take hours by hand now takes seconds with our AI. Turn complex PDFs into clean, structured data you can actually use. Extract data from PDFs with visual proof - every extraction shows exactly where it came from.",
	keywords: [
		"PDF data extraction",
		"AI document processing",
		"PDF to CSV converter",
		"invoice extraction",
		"medical record processing",
		"bank statement parser",
		"PDF table extraction",
		"document automation",
		"OCR with verification",
		"PDF parsing API",
	],
	authors: [{ name: "Precision PDF" }],
	creator: "Precision PDF",
	publisher: "Precision PDF",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		title:
			"Precision PDF - Extract Data from PDFs with AI & Visual Verification",
		description:
			"What used to take hours by hand now takes seconds with our AI. Turn complex PDFs into clean, structured data you can actually use.",
		url: "https://precisionpdf.com",
		siteName: "Precision PDF",
		images: [
			{
				url: "https://precisionpdf.com/og-image.png",
				width: 1200,
				height: 630,
				alt: "Precision PDF - AI Document Processing with Visual Verification",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Precision PDF - AI-Powered PDF Data Extraction",
		description:
			"What used to take hours by hand now takes seconds with our AI. Turn complex PDFs into clean, structured data you can actually use.",
		images: ["https://precisionpdf.com/twitter-image.png"],
		creator: "@precisionpdf",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: "/convex.svg",
		shortcut: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	manifest: "/site.webmanifest",
	metadataBase: new URL("https://precisionpdf.com"),
	alternates: {
		canonical: "/",
	},
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<Script
					data-website-id="68727e9c527beef6ff8a8b07"
					data-domain="www.precisionpdf.com.COM"
					src="https://datafa.st/js/script.js"
					strategy="afterInteractive"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ClerkProvider
					dynamic
					signInFallbackRedirectUrl="/dashboard"
					signUpFallbackRedirectUrl="/dashboard"
				>
					<ConvexClientProvider>{children}</ConvexClientProvider>
				</ClerkProvider>
				{process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID && (
					<Script
						id="crisp-widget"
						strategy="afterInteractive"
						dangerouslySetInnerHTML={{
							__html: `
								window.$crisp=[];
								window.CRISP_WEBSITE_ID="${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";
								(function(){
									d=document;
									s=d.createElement("script");
									s.src="https://client.crisp.chat/l.js";
									s.async=1;
									d.getElementsByTagName("head")[0].appendChild(s);
								})();
							`,
						}}
					/>
				)}
			</body>
		</html>
	);
}
