defmodule ChatServiceWeb.RoomChannel do
  use Phoenix.Channel
  alias ChatService.Messages
  alias ChatService.PubSub

  @impl true
  def join("room:" <> listing_id, _payload, socket) do
    send(self(), {:after_join, listing_id})
    {:ok, assign(socket, :listing_id, listing_id)}
  end

  @impl true
  def handle_info({:after_join, listing_id}, socket) do
    # Send last 50 messages on join
    messages = Messages.list_for_listing(listing_id, limit: 50)
    push(socket, "history", %{messages: messages})
    {:noreply, socket}
  end

  @impl true
  def handle_in("new_message", %{"body" => body}, socket) when byte_size(body) > 0 do
    listing_id = socket.assigns.listing_id
    user_id    = socket.assigns.user_id

    msg = Messages.create!(%{
      listing_id: listing_id,
      sender_id:  user_id,
      body:       body,
    })

    # Broadcast to everyone in the room
    broadcast!(socket, "new_message", %{
      id:         msg.id,
      sender_id:  msg.sender_id,
      body:       msg.body,
      sent_at:    DateTime.to_iso8601(msg.inserted_at),
    })

    # Emit Kafka event for notification-service
    :brod.produce_sync(
      :kafka_client, "messages.sent", 0, user_id,
      Jason.encode!(%{
        listing_id: listing_id,
        sender_id:  user_id,
        preview:    String.slice(body, 0, 80),
      })
    )

    {:noreply, socket}
  end

  def handle_in("new_message", _payload, socket) do
    {:reply, {:error, %{reason: "message_too_short"}}, socket}
  end
end
