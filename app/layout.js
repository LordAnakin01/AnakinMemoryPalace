import "./globals.css";

export const metadata = {
  title: "Memory Palace",
  description: "Train the method of loci in a 3D palace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
