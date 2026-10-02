import "./globals.css";
import { Toaster } from "sonner";
import Header from "./components/Header";
import UserLocationSync from "./components/UserLocationSync";
import AppInitializer from "./components/AppInitializer";
import ThemeRegistry from "./components/ThemeRegistry";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { RealtimeProvider } from "@/lib/contexts/RealtimeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ marginRight: "15%", marginLeft: "15%" }}>
        <ThemeRegistry>
          <AuthProvider>
            <RealtimeProvider>
              <Header />
              <UserLocationSync />
              <main>
                <AppInitializer>{children}</AppInitializer>
              </main>
              <Toaster position="top-right" richColors />
            </RealtimeProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
