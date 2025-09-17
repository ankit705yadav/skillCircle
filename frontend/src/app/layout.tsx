import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "./components/Header";
import UserLocationSync from "./components/UserLocationSync";
import AppInitializer from "./components/AppInitializer";
import ThemeRegistry from "./components/ThemeRegistry";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ marginRight: "15%", marginLeft: "15%" }}>
          <ThemeRegistry>
            <Header />
            <UserLocationSync />
            <main>
              <AppInitializer>{children}</AppInitializer>
            </main>
          </ThemeRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
