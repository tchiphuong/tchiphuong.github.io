import "./globals.css";

export const metadata = {
  title: "Shared Link Manager",
  description: "Quản lý link dùng chung theo nhóm với cơ chế khóa đồng thời.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark">
      <body>{children}</body>
    </html>
  );
}
