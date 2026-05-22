{-# LANGUAGE DataKinds         #-}
{-# LANGUAGE TypeOperators     #-}
{-# LANGUAGE DeriveGeneric     #-}
{-# LANGUAGE OverloadedStrings #-}

module Main where

import Data.Aeson
import Data.Aeson.KeyMap (KeyMap, keys)
import qualified Data.Aeson.Key as K
import qualified Data.Aeson.KeyMap as KM
import Data.Scientific (Scientific)
import qualified Data.Text as T
import Data.Char (isHexDigit)
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

-- Structural validation plus listing-specific business rules.
validate :: ValidateRequest -> Handler ValidationResult
validate req =
  case payload req of
    Object obj ->
      let currentKeys = map K.toString (keys obj)
          requiredFields = requiredFor (schemaName req)
          missing = filter (`notElem` currentKeys) requiredFields
          errs = map ("Missing required field: " <>) missing
              <> semanticErrors (schemaName req) obj
      in return ValidationResult { valid = null errs, errors = errs }
    _ -> return ValidationResult { valid = False, errors = ["Payload must be a JSON object"] }

-- Required fields per schema
requiredFor :: String -> [String]
requiredFor "listing"  = ["title", "price", "category", "seller_id"]
requiredFor "user"     = ["email", "username"]
requiredFor "payment"  = ["amount", "currency", "user_id"]
requiredFor "review"   = ["listing_id", "rating", "body"]
requiredFor _          = []

semanticErrors :: String -> KeyMap Value -> [String]
semanticErrors "listing" obj =
  concat
    [ textLength "title" 3 160 obj
    , positiveNumber "price" 1000000 obj
    , textLength "category" 1 64 obj
    , uuidField "seller_id" obj
    , textLength "location" 1 80 obj
    ]
semanticErrors _ _ = []

textLength :: String -> Int -> Int -> KeyMap Value -> [String]
textLength field minLen maxLen obj =
  case KM.lookup (K.fromString field) obj of
    Nothing -> []
    Just (String raw) ->
      let value = T.strip raw
          len = T.length value
      in if len < minLen || len > maxLen
           then [field <> " must be between " <> show minLen <> " and " <> show maxLen <> " characters"]
           else []
    Just _ -> [field <> " must be a string"]

positiveNumber :: String -> Scientific -> KeyMap Value -> [String]
positiveNumber field maxValue obj =
  case KM.lookup (K.fromString field) obj of
    Nothing -> []
    Just (Number value)
      | value <= 0 -> [field <> " must be greater than 0"]
      | value > maxValue -> [field <> " must be at most " <> show maxValue]
      | otherwise -> []
    Just _ -> [field <> " must be a number"]

uuidField :: String -> KeyMap Value -> [String]
uuidField field obj =
  case KM.lookup (K.fromString field) obj of
    Nothing -> []
    Just (String value)
      | looksLikeUuid (T.unpack value) -> []
      | otherwise -> [field <> " must be a UUID"]
    Just _ -> [field <> " must be a string"]

looksLikeUuid :: String -> Bool
looksLikeUuid value =
  length value == 36
    && all (\idx -> value !! idx == '-') [8, 13, 18, 23]
    && all isHexDigit hexChars
  where
    hexChars = [ch | (idx, ch) <- zip [0 :: Int ..] value, idx `notElem` [8, 13, 18, 23]]

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
