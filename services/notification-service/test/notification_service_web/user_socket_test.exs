defmodule NotificationServiceWeb.UserSocketTest do
  use ExUnit.Case, async: true

  alias NotificationServiceWeb.UserSocket

  test "verifies RS256 JWTs before accepting socket user identity" do
    {private_key, public_key_pem} = rsa_keypair()
    token = signed_jwt(%{"sub" => "user-123"}, private_key)

    System.put_env("JWT_PUBLIC_KEY", public_key_pem)

    assert UserSocket.verify_token(token) == {:ok, "user-123"}
  after
    System.delete_env("JWT_PUBLIC_KEY")
  end

  test "rejects forged JWT payloads without a valid signature" do
    {private_key, public_key_pem} = rsa_keypair()
    token = signed_jwt(%{"sub" => "user-123"}, private_key)
    [header, _payload, signature] = String.split(token, ".")
    forged_payload = base64url(Jason.encode!(%{"sub" => "admin"}))

    System.put_env("JWT_PUBLIC_KEY", public_key_pem)

    assert UserSocket.verify_token("#{header}.#{forged_payload}.#{signature}") ==
             {:error, "invalid_signature"}
  after
    System.delete_env("JWT_PUBLIC_KEY")
  end

  test "rejects unsigned tokens" do
    header = base64url(Jason.encode!(%{"alg" => "none"}))
    payload = base64url(Jason.encode!(%{"sub" => "user-123"}))

    System.put_env("JWT_PUBLIC_KEY", "unused")

    assert UserSocket.verify_token("#{header}.#{payload}.") == {:error, "invalid_algorithm"}
  after
    System.delete_env("JWT_PUBLIC_KEY")
  end

  defp signed_jwt(claims, private_key) do
    header = base64url(Jason.encode!(%{"alg" => "RS256", "typ" => "JWT"}))
    payload = base64url(Jason.encode!(claims))
    signing_input = "#{header}.#{payload}"
    signature = :public_key.sign(signing_input, :sha256, private_key)

    "#{signing_input}.#{base64url(signature)}"
  end

  defp rsa_keypair do
    private_key = :public_key.generate_key({:rsa, 2048, 65_537})
    public_key = {:RSAPublicKey, elem(private_key, 2), elem(private_key, 3)}

    public_key_pem =
      :public_key.pem_encode([
        :public_key.pem_entry_encode(:SubjectPublicKeyInfo, public_key)
      ])

    {private_key, public_key_pem}
  end

  defp base64url(value), do: Base.url_encode64(value, padding: false)
end
