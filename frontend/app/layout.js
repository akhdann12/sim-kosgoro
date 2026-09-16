import "./globals.css";
import { GuruMasterProvider } from "@/lib/context/GuruMasterContext";
import { TahunAjaranProvider } from "@/lib/context/TahunAjaranContext";
import { NotificationProvider } from "@/lib/context/NotificationContext";
import { AuthProvider } from "@/lib/context/AuthContext";

export const metadata = {
  title: "SIM KOSGORO - Kurikulum & Presensi",
  description: "Sistem Informasi Presensi Guru - SMK Kosgoro Bogor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* FontAwesome for Icons - sama seperti desain asli */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* Google Fonts: Inter */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex h-screen overflow-hidden text-slate-800">
        <AuthProvider>
          <NotificationProvider>
            <GuruMasterProvider>
              <TahunAjaranProvider>{children}</TahunAjaranProvider>
            </GuruMasterProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
