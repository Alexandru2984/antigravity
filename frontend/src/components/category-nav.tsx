export default function CategoryNav() {
  const cats = ['All', 'Assembly', 'Brainfuck', 'C', 'COBOL', 'Elixir', 'Go', 'Rust'];
  return (
    <div className="flex gap-2 overflow-x-auto pb-8 no-scrollbar">
      {cats.map(c => (
        <button key={c} className="whitespace-nowrap px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          {c}
        </button>
      ))}
    </div>
  );
}
