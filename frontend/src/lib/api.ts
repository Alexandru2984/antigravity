export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function fetchListings() {
  const res = await fetch(`${API_BASE_URL}/api/v1/listings`);
  if (!res.ok) return [];
  return res.json();
}
