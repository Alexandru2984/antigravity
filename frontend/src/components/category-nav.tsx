export const CategoryNav = () => (
    <div className="flex gap-2 overflow-x-auto pb-8">
      {['All', 'Rust', 'Go'].map(c => <button key={c} className="px-6 py-2 rounded-full bg-white/5 text-white/70">{c}</button>)}
    </div>
);
export default CategoryNav;
