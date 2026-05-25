defmodule ChatService.MessagesTest do
  use ExUnit.Case, async: true

  alias ChatService.Messages.Message

  test "message schema maps the public body field to the content column" do
    assert Message.__schema__(:source) == "messages"
    assert Message.__schema__(:field_source, :body) == :content
    assert Message.__schema__(:field_source, :inserted_at) == :created_at
    assert Message.__schema__(:type, :sender_id) == Ecto.UUID
  end

  test "message changeset requires listing, sender, and body" do
    changeset = Message.changeset(%Message{}, %{})

    refute changeset.valid?

    assert errors_on(changeset) == %{
             body: ["can't be blank"],
             listing_id: ["can't be blank"],
             sender_id: ["can't be blank"]
           }
  end

  test "message changeset rejects oversized bodies" do
    changeset =
      Message.changeset(%Message{}, %{
        listing_id: "listing-1",
        sender_id: "11111111-1111-1111-1111-111111111111",
        body: String.duplicate("x", 4001)
      })

    refute changeset.valid?
    assert errors_on(changeset) == %{body: ["should be at most 4000 character(s)"]}
  end

  defp errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
