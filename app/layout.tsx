import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIOS-50 Agency",
  description: "AI Automation Agency Command Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080808", color: "#c8c8c8" }}>
        {children}
      </body>
    </html>
  );
}
