import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          POLYGLOT
        </Link>
        <div className="flex gap-6 text-sm font-medium text-white/70">
          <Link href="/search" className="hover:text-white transition-colors">Search</Link>
          <Link href="/listings" className="hover:text-white transition-colors">Listings</Link>
          <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
