import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "./components/Header";
import UserLocationSync from "./components/UserLocationSync";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Header />
          <UserLocationSync />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
