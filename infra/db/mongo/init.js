// ============================================================
// PolyMarket — MongoDB Init
// Creates indexes and validation for listings collection
// ============================================================
db = db.getSiblingDB('polymarket');

// ── Listings Collection ─────────────────────────────────────
const listingValidator = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'price', 'category', 'seller_id', 'status'],
      properties: {
        title:       { bsonType: 'string', minLength: 3, maxLength: 200 },
        description: { bsonType: 'string', maxLength: 5000 },
        price:       { bsonType: 'int', minimum: 0 },
        currency:    { enum: ['RON', 'EUR', 'USD'] },
        category:    { bsonType: 'string' },
        subcategory: { bsonType: 'string' },
        seller_id:   { bsonType: 'string' },  // UUID from auth service
        images:      {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['url', 'key'],
            properties: {
              url:       { bsonType: 'string' },
              key:       { bsonType: 'string' },  // MinIO key
              thumbnail: { bsonType: 'string' },
              medium:    { bsonType: 'string' }
            }
          }
        },
        location: {
          bsonType: 'object',
          required: ['city', 'county'],
          properties: {
            city:      { bsonType: 'string' },
            county:    { bsonType: 'string' },
            address:   { bsonType: 'string' },
            coordinates: {
              bsonType: 'object',
              properties: {
                type:        { enum: ['Point'] },
                coordinates: { bsonType: 'array' }   // [lng, lat]
              }
            }
          }
        },
        attributes: { bsonType: 'object' },   // category-specific: mileage, rooms, etc.
        status:     { enum: ['draft', 'active', 'sold', 'expired', 'deleted'] },
        views:      { bsonType: 'int', minimum: 0 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        expires_at: { bsonType: 'date' }
      }
    }
  }
};

if (db.getCollectionNames().includes('listings')) {
  db.runCommand({
    collMod: 'listings',
    validator: listingValidator.validator,
    validationLevel: 'strict',
    validationAction: 'error'
  });
} else {
  db.createCollection('listings', listingValidator);
}

// Indexes for listing queries
db.listings.createIndex({ seller_id: 1 });
db.listings.createIndex({ category: 1, status: 1 });
db.listings.createIndex({ status: 1, created_at: -1 });
db.listings.createIndex({ price: 1, status: 1 });
db.listings.createIndex({ 'location.city': 1, status: 1 });
// Geo index for proximity search
db.listings.createIndex({ 'location.coordinates': '2dsphere' });
// Text search index (fallback alongside OpenSearch)
db.listings.createIndex(
  { title: 'text', description: 'text' },
  { weights: { title: 10, description: 1 }, name: 'listings_text_idx' }
);
// TTL index: auto-expire listings after 60 days
db.listings.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ── Categories Collection ────────────────────────────────────
if (!db.getCollectionNames().includes('categories')) {
  db.createCollection('categories');
}
db.categories.createIndex({ slug: 1 }, { unique: true });

// Seed base categories
[
  { slug: 'auto',        name: 'Auto, Moto și Bărci',    icon: '🚗', subcategories: ['autoturisme', 'motociclete', 'camioane', 'barci'] },
  { slug: 'imobiliare',  name: 'Imobiliare',              icon: '🏠', subcategories: ['apartamente', 'case', 'terenuri', 'spatii-comerciale'] },
  { slug: 'electronice', name: 'Electronice și Electrocasnice', icon: '💻', subcategories: ['telefoane', 'laptopuri', 'tv', 'electrocasnice'] },
  { slug: 'moda',        name: 'Modă și Frumusețe',       icon: '👗', subcategories: ['haine', 'incaltaminte', 'accesorii', 'cosmetice'] },
  { slug: 'casa',        name: 'Casă și Grădină',         icon: '🛋',  subcategories: ['mobilier', 'gradina', 'bricolaj', 'decoratiuni'] },
  { slug: 'sport',       name: 'Sport și Timp Liber',     icon: '⚽',  subcategories: ['bicicleta', 'fitness', 'camping', 'arta'] },
  { slug: 'animale',     name: 'Animale de Companie',     icon: '🐾',  subcategories: ['caini', 'pisici', 'pasari', 'accesorii'] },
  { slug: 'servicii',    name: 'Servicii',                icon: '🔧',  subcategories: ['constructii', 'transport', 'auto-service', 'curatenie'] },
  { slug: 'locuri-munca', name: 'Locuri de Muncă',        icon: '💼',  subcategories: ['it', 'vanzari', 'constructii', 'administrativ'] },
].forEach((category) => {
  db.categories.updateOne(
    { slug: category.slug },
    { $set: category },
    { upsert: true }
  );
});

print('PolyMarket MongoDB init complete.');
