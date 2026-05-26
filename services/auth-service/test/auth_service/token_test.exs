defmodule AuthService.TokenTest do
  use ExUnit.Case, async: true

  alias AuthService.Token

  test "generates opaque refresh tokens as 64 lowercase hex characters" do
    token = Token.generate_opaque()

    assert byte_size(token) == 64
    assert token =~ ~r/\A[0-9a-f]{64}\z/
  end

  test "generates unique opaque refresh tokens" do
    tokens =
      1..20
      |> Enum.map(fn _ -> Token.generate_opaque() end)
      |> MapSet.new()

    assert MapSet.size(tokens) == 20
  end
end
