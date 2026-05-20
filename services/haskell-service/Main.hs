{-# LANGUAGE OverloadedStrings #-}
import Network.Wai
import Network.Wai.Handler.Warp
import Network.HTTP.Types
import Data.Aeson
import qualified Data.ByteString.Lazy as BL

data ComputeInput = ComputeInput { values :: [Double] } deriving (Show)
instance FromJSON ComputeInput where
    parseJSON = withObject "ComputeInput" $ \v -> ComputeInput <$> v .: "values"

main :: IO ()
main = do
    let port = 4065
    putStrLn $ "Haskell Validator running on port " ++ show port
    run port app

app :: Application
app req respond = case requestMethod req of
    "POST" -> do
        body <- strictRequestBody req
        case decode body of
            Just (ComputeInput vals) -> 
                if all (> 0) vals 
                then respond $ responseLBS status200 [("Content-Type", "application/json")] "{\"valid\":true, \"msg\":\"Data is mathematically sound\"}"
                else respond $ responseLBS status400 [("Content-Type", "application/json")] "{\"valid\":false, \"msg\":\"Negative values detected\"}"
            Nothing -> respond $ responseLBS status400 [] "Invalid JSON"
    _ -> respond $ responseLBS status200 [("Content-Type", "application/json")] "{\"status\":\"ready\"}"
