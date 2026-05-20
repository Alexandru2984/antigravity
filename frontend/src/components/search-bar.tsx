export default function SearchBar() {
  return (
    <div className="relative max-w-2xl mx-auto mb-12">
      <input type="text" placeholder="Search for exotic services..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-colors" />
      <button className="absolute right-3 top-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors">Search</button>
    </div>
  );
}
