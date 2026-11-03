import "./globals.css";

export const metadata = {
  title: "Meet Manager",
  description: "Quản lý liên kết Google Meet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark">
      <body>{children}</body>
    </html>
  );
}
