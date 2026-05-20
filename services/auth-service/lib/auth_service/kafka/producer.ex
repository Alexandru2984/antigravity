defmodule AuthService.Kafka.Producer do
  @moduledoc """
  Kafka producer using :brod.
  Produces JSON messages to PolyMarket Kafka topics.
  """
  use GenServer
  require Logger

  @client_id :auth_service_kafka

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    brokers = Application.get_env(:auth_service, :kafka_brokers, [{"localhost", 9092}])
    case :brod.start_client(brokers, @client_id, auto_start_producers: true) do
      :ok ->
        Logger.info("[Kafka] Producer connected to #{inspect(brokers)}")
        {:ok, %{}}

      {:error, {:already_started, _}} ->
        {:ok, %{}}

      {:error, reason} ->
        Logger.warning("[Kafka] Failed to connect: #{inspect(reason)} — messages will be dropped")
        {:ok, %{connected: false}}
    end
  end

  @doc """
  Produce a JSON message to the given Kafka topic.
  Fire-and-forget — errors are logged but not raised.
  """
  def produce(topic, payload) when is_map(payload) do
    GenServer.cast(__MODULE__, {:produce, topic, payload})
  end

  def handle_cast({:produce, topic, payload}, state) do
    key   = Map.get(payload, :user_id, "") |> to_string()
    value = Jason.encode!(payload)

    case :brod.produce_sync(@client_id, topic, :hash, key, value) do
      :ok ->
        Logger.debug("[Kafka] Produced to #{topic}: #{value}")

      {:error, reason} ->
        Logger.error("[Kafka] Failed to produce to #{topic}: #{inspect(reason)}")
    end

    {:noreply, state}
  end
end
