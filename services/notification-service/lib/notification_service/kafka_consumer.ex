defmodule NotificationService.KafkaConsumer do
  @moduledoc """
  Kafka consumer that bridges events to Phoenix Channels via PubSub.

  Consumes:
    - polymarket.listings.created  → notifies followers
    - polymarket.payments.completed → notifies buyer/seller
    - polymarket.users.registered  → welcome notification
    - polymarket.notifications.*   → generic notification events
  """

  use GenServer
  require Logger

  @client_id :notification_kafka
  @group_id "notification-service"

  @topics [
    "polymarket.listings.created",
    "polymarket.payments.completed",
    "polymarket.users.registered",
    "polymarket.notifications.send"
  ]

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    brokers = Application.fetch_env!(:notification_service, :kafka_brokers)

    case apply(:brod, :start_client, [brokers, @client_id, [auto_start_producers: false]]) do
      :ok ->
        subscribe_topics()

      {:error, {:already_started, _}} ->
        subscribe_topics()

      {:error, reason} ->
        Logger.warning("[Kafka Consumer] Connection failed: #{inspect(reason)}")
    end

    {:ok, %{}}
  end

  defp subscribe_topics do
    Enum.each(@topics, fn topic ->
      case apply(:brod, :start_link_group_subscriber, [
             @client_id,
             @group_id,
             [topic],
             _group_config = [{:offset_commit_policy, :commit_to_kafka_v2}],
             _consumer_config = [{:begin_offset, :latest}],
             __MODULE__,
             []
           ]) do
        {:ok, _pid} ->
          :ok

        {:error, {:already_started, _pid}} ->
          :ok

        {:error, reason} ->
          Logger.warning("[Kafka] Subscribe failed for #{topic}: #{inspect(reason)}")
      end
    end)
  end

  # ── :brod callbacks ─────────────────────────────────────────
  def init(_group_id, _state), do: {:ok, %{}}

  def handle_message(topic, _partition, message, state) do
    # {offset, key, value, ts}
    value = elem(message, 3)

    case Jason.decode(value) do
      {:ok, payload} -> dispatch(topic, payload)
      {:error, _} -> Logger.warning("[Kafka] Bad JSON on #{topic}: #{value}")
    end

    {:ok, :ack, state}
  end

  # ── Dispatch to Phoenix PubSub ───────────────────────────────
  defp dispatch("polymarket.listings.created", %{"seller_id" => seller_id} = payload) do
    # Broadcast to seller's personal channel
    Phoenix.PubSub.broadcast(NotificationService.PubSub, "user:#{seller_id}", {
      :notification,
      %{type: "listing_created", payload: payload}
    })
  end

  defp dispatch(
         "polymarket.payments.completed",
         %{"buyer_id" => buyer, "seller_id" => seller} = payload
       ) do
    for user_id <- [buyer, seller] do
      Phoenix.PubSub.broadcast(NotificationService.PubSub, "user:#{user_id}", {
        :notification,
        %{type: "payment_completed", payload: payload}
      })
    end
  end

  defp dispatch("polymarket.notifications.send", %{"user_id" => user_id} = payload) do
    Phoenix.PubSub.broadcast(NotificationService.PubSub, "user:#{user_id}", {
      :notification,
      %{type: "direct", payload: payload}
    })
  end

  defp dispatch(topic, payload) do
    Logger.debug("[Kafka] Unhandled topic #{topic}: #{inspect(payload)}")
  end
end
