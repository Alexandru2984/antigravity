export default function ListingCard({ listing }: { listing: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all cursor-pointer group">
      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl mb-4 overflow-hidden">
        <div className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{listing.title}</h3>
      <p className="text-white/50 text-sm mb-4 line-clamp-2">{listing.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-blue-400 font-bold">${listing.price}</span>
        <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}
