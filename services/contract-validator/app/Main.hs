{-# LANGUAGE DataKinds         #-}
{-# LANGUAGE TypeOperators     #-}
{-# LANGUAGE DeriveGeneric     #-}
{-# LANGUAGE OverloadedStrings #-}

module Main where

import Data.Aeson
import Data.Aeson.KeyMap (keys)
import qualified Data.Aeson.Key as K
import GHC.Generics
import Network.Wai.Handler.Warp (run)
import Servant

-- ── Request/Response types ────────────────────────────────────

data ValidateRequest = ValidateRequest
  { payload    :: Value   -- ^ JSON data to validate
  , schemaName :: String  -- ^ Which service schema to validate against
  } deriving (Generic, Show)

instance FromJSON ValidateRequest
instance ToJSON   ValidateRequest

data ValidationResult = ValidationResult
  { valid  :: Bool
  , errors :: [String]
  } deriving (Generic, Show)

instance ToJSON ValidationResult

data HealthResponse = HealthResponse
  { status  :: String
  , service :: String
  } deriving (Generic, Show)

instance ToJSON HealthResponse

-- ── API ───────────────────────────────────────────────────────

type API =
       "health"   :> Get '[JSON] HealthResponse
  :<|> "ready"    :> Get '[JSON] HealthResponse
  :<|> "validate" :> ReqBody '[JSON] ValidateRequest :> Post '[JSON] ValidationResult

-- ── Handlers ─────────────────────────────────────────────────

health :: Handler HealthResponse
health = return HealthResponse { status = "ok", service = "contract-validator" }

-- Simple structural validation: check required fields are present
validate :: ValidateRequest -> Handler ValidationResult
validate req =
  case payload req of
    Object obj ->
      let currentKeys = map (show . K.toText) (keys obj)
          requiredFields = requiredFor (schemaName req)
          missing = filter (\f -> not (f `elem` currentKeys)) requiredFields
          errs = map (\f -> "Missing required field: " <> f) missing
      in return ValidationResult { valid = null errs, errors = errs }
    _ -> return ValidationResult { valid = False, errors = ["Payload must be a JSON object"] }

-- Required fields per schema
requiredFor :: String -> [String]
requiredFor "listing"  = ["title", "price", "category", "seller_id"]
requiredFor "user"     = ["email", "username"]
requiredFor "payment"  = ["amount", "currency", "user_id"]
requiredFor "review"   = ["listing_id", "rating", "body"]
requiredFor _          = []

-- ── Server ───────────────────────────────────────────────────

server :: Server API
server = health :<|> health :<|> validate

api :: Proxy API
api = Proxy

main :: IO ()
main = do
  let port = 4035 :: Int
  putStrLn $ "contract-validator running on :" <> show port
  run port (serve api server)
