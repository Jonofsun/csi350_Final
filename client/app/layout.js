// client/app/layout.js
export const metadata = {
  title: 'D&D Character Sheets',
  description: 'Manage your party in real time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">D&D Sheets</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
