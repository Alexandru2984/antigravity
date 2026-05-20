defmodule ChatService.Messages do
  import Ecto.Query
  alias ChatService.Repo
  alias ChatService.Messages.Message

  def list_for_listing(listing_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    Repo.all(
      from m in Message,
        where: m.listing_id == ^listing_id,
        order_by: [asc: m.inserted_at],
        limit: ^limit
    )
  end

  def create!(%{listing_id: _, sender_id: _, body: _} = attrs) do
    %Message{} |> Message.changeset(attrs) |> Repo.insert!()
  end
end

defmodule ChatService.Messages.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "messages" do
    field :listing_id, :string
    field :sender_id,  :string
    field :body,       :string
    timestamps()
  end

  def changeset(msg, attrs) do
    msg
    |> cast(attrs, [:listing_id, :sender_id, :body])
    |> validate_required([:listing_id, :sender_id, :body])
    |> validate_length(:body, min: 1, max: 4000)
  end
end
