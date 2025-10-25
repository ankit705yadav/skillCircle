import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "./components/Header";
import UserLocationSync from "./components/UserLocationSync";
import AppInitializer from "./components/AppInitializer";
import ThemeRegistry from "./components/ThemeRegistry";
import { WebSocketProvider } from "@/lib/contexts/WebSocketContext";

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
            <WebSocketProvider>
              <Header />
              <UserLocationSync />
              <main>
                <AppInitializer>{children}</AppInitializer>
              </main>
              <Toaster position="top-right" richColors />
            </WebSocketProvider>
          </ThemeRegistry>
        </body>
      </html>
    </ClerkProvider>
  );
}
