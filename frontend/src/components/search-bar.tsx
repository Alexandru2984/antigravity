export const SearchBar = ({ className }: { className?: string }) => (
    <div className={className}>
      <input type="text" placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white" />
    </div>
);
export default SearchBar;
