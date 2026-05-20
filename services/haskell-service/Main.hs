{-# LANGUAGE OverloadedStrings #-}
import Network.Wai
import Network.Wai.Handler.Warp
import Network.HTTP.Types
import Data.Aeson
import Network.Wai.Middleware.RequestLogger

main :: IO ()
main = do
    let port = 4065
    putStrLn $ "Haskell Service running on port " ++ show port
    run port app

app :: Application
app req respond = respond $ responseLBS
    status200
    [("Content-Type", "application/json")]
    "{\"status\":\"ok\", \"service\":\"haskell-functional-purity\"}"
