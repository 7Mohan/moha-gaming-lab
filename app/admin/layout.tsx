export const metadata = {
  title: "Admin Control Hub | Moha Gaming Lab",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-wrapper bg-[#07090E] min-h-screen">{children}</div>;
}
