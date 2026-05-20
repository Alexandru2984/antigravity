import ListingCard from './listing-card';
export default function ListingGrid({ listings }: { listings: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((l, i) => <ListingCard key={i} listing={l} />)}
    </div>
  );
}
