import Config

config :polyglot, start_http?: true

for config <- ["#{config_env()}.exs"], File.exists?(Path.join(__DIR__, config)) do
  import_config config
end
