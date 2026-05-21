use anyhow::Result;
use bson::{doc, Document};
use chrono::{Duration, Utc};
use futures::TryStreamExt;
use mongodb::{
    options::{FindOptions, IndexOptions},
    Client, Collection, Database, IndexModel,
};
use uuid::Uuid;

use crate::models::{CreateListingRequest, Listing, ListingQuery, ListingStatus, Location};

pub const COLLECTION: &str = "listings";

fn uuid_to_bson_binary(uuid: Uuid) -> bson::Bson {
    let bytes = uuid.as_bytes().to_vec();
    bson::Bson::Binary(bson::Binary {
        subtype: bson::spec::BinarySubtype::Generic,
        bytes,
    })
}

#[derive(Clone)]
pub struct MongoRepo {
    col: Collection<Listing>,
}

impl MongoRepo {
    pub async fn new(uri: &str, db_name: &str) -> Result<Self> {
        let client = Client::with_uri_str(uri).await?;
        let db: Database = client.database(db_name);
        let col: Collection<Listing> = db.collection(COLLECTION);

        // Ensure indexes
        Self::ensure_indexes(&col).await?;

        Ok(Self { col })
    }

    async fn ensure_indexes(col: &Collection<Listing>) -> Result<()> {
        let indexes = vec![
            IndexModel::builder()
                .keys(doc! { "category": 1, "status": 1, "created_at": -1 })
                .options(IndexOptions::builder().background(true).build())
                .build(),
            IndexModel::builder()
                .keys(doc! { "seller_id": 1, "status": 1 })
                .options(IndexOptions::builder().background(true).build())
                .build(),
            IndexModel::builder()
                .keys(doc! { "location.city": 1 })
                .options(IndexOptions::builder().background(true).build())
                .build(),
            IndexModel::builder()
                .keys(doc! { "expires_at": 1 })
                .options(
                    IndexOptions::builder()
                        .expire_after(std::time::Duration::from_secs(0))
                        .background(true)
                        .build(),
                )
                .build(),
        ];

        col.create_indexes(indexes).await?;
        Ok(())
    }

    pub async fn create(&self, seller_id: Uuid, req: CreateListingRequest) -> Result<Listing> {
        let now = Utc::now();
        let listing = Listing {
            id: None,
            title: req.title,
            description: req.description.unwrap_or_default(),
            price: req.price,
            currency: req.currency.unwrap_or("RON".into()),
            category: req.category,
            subcategory: req.subcategory,
            seller_id,
            images: vec![], // populated by image-service
            location: Location {
                city: req.location.city,
                county: req.location.county,
                address: None,
                lat: req.location.lat,
                lng: req.location.lng,
            },
            attributes: req.attributes.unwrap_or(serde_json::json!({})),
            status: ListingStatus::Active,
            views: 0,
            created_at: now,
            expires_at: now + Duration::days(30),
            updated_at: now,
        };

        let result = self.col.insert_one(&listing).await?;

        let mut listing = listing;
        listing.id = result.inserted_id.as_object_id();
        Ok(listing)
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Listing>> {
        let oid = bson::oid::ObjectId::parse_str(id)?;
        let filter = doc! { "_id": oid, "status": { "$ne": "deleted" } };
        Ok(self.col.find_one(filter).await?)
    }

    pub async fn list(&self, query: &ListingQuery) -> Result<(Vec<Listing>, u64)> {
        let page = query.page.unwrap_or(1).max(1);
        let limit = query.limit.unwrap_or(20).min(100);
        let skip = (page - 1) * limit;

        let mut filter = doc! { "status": "active" };
        if let Some(cat) = &query.category {
            filter.insert("category", cat.clone());
        }
        if let Some(status) = &query.status {
            filter.insert("status", status.clone());
        }
        if let Some(seller) = &query.seller_id {
            filter.insert("seller_id", uuid_to_bson_binary(*seller));
        }

        let total = self.col.count_documents(filter.clone()).await?;

        let opts = FindOptions::builder()
            .sort(doc! { "created_at": -1 })
            .skip(skip)
            .limit(limit as i64)
            .build();

        let cursor = self.col.find(filter).with_options(opts).await?;
        let listings: Vec<Listing> = cursor.try_collect().await?;

        Ok((listings, total))
    }

    pub async fn update(
        &self,
        id: &str,
        seller_id: Uuid,
        update: Document,
    ) -> Result<Option<Listing>> {
        let oid = bson::oid::ObjectId::parse_str(id)?;
        let filter = doc! { "_id": oid, "seller_id": uuid_to_bson_binary(seller_id) };
        let opts = mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build();

        Ok(self
            .col
            .find_one_and_update(filter, doc! { "$set": update })
            .with_options(opts)
            .await?)
    }

    pub async fn delete(&self, id: &str, seller_id: Uuid, is_admin: bool) -> Result<bool> {
        let oid = bson::oid::ObjectId::parse_str(id)?;
        let filter = if is_admin {
            doc! { "_id": oid }
        } else {
            doc! { "_id": oid, "seller_id": uuid_to_bson_binary(seller_id) }
        };

        let result = self
            .col
            .update_one(filter, doc! { "$set": { "status": "deleted" } })
            .await?;

        Ok(result.modified_count > 0)
    }

    pub async fn mark_sold(&self, id: &str, seller_id: Uuid) -> Result<Option<Listing>> {
        let update = doc! {
            "status":     "sold",
            "updated_at": Utc::now().to_rfc3339(),
        };
        self.update(id, seller_id, update).await
    }

    pub async fn increment_views(&self, id: &str) -> Result<()> {
        let oid = bson::oid::ObjectId::parse_str(id)?;
        self.col
            .update_one(doc! { "_id": oid }, doc! { "$inc": { "views": 1 } })
            .await?;
        Ok(())
    }
}
