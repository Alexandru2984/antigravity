defmodule AuthService.Token do
  @moduledoc "Generates cryptographically secure opaque refresh tokens."

  @token_bytes 32

  @doc """
  Returns a 64-character hex-encoded random token.
  Suitable for use as a refresh token or nonce.
  """
  def generate_opaque do
    @token_bytes
    |> :crypto.strong_rand_bytes()
    |> Base.encode16(case: :lower)
  end
end
