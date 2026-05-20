export const ListingCard = ({ listing }: { listing: any }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
      <h3 className="text-lg font-semibold text-white mb-1">{listing.title}</h3>
    </div>
);
export default ListingCard;
