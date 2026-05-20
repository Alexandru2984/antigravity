defmodule AuthService.RedisPool do
  @moduledoc """
  Poolboy-backed Redix connection pool.
  Use `AuthService.RedisPool.command/1` for Redis commands.
  """

  @pool_name :redis_pool
  @pool_size  5
  @timeout    5_000

  def child_spec(_opts) do
    pool_opts = [
      name:   {:local, @pool_name},
      worker_module: AuthService.RedisWorker,
      size:    @pool_size,
      max_overflow: 2
    ]
    :poolboy.child_spec(@pool_name, pool_opts, [])
  end

  def start_link(opts \\ []) do
    pool_opts = [
      name:   {:local, @pool_name},
      worker_module: AuthService.RedisWorker,
      size:    @pool_size,
      max_overflow: 2
    ]
    :poolboy.start_link(pool_opts, opts)
  end

  def command(cmd) do
    :poolboy.transaction(
      @pool_name,
      fn worker -> AuthService.RedisWorker.command(worker, cmd) end,
      @timeout
    )
  end
end

defmodule AuthService.RedisWorker do
  use GenServer

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, [], [])
  end

  def init(_) do
    redis_url = Application.get_env(:auth_service, :redis_url, "redis://localhost:6379")
    uri = URI.parse(redis_url)
    host = uri.host || "localhost"
    port = uri.port || 6379
    password = case uri.userinfo do
      ":" <> pw -> pw
      pw when is_binary(pw) -> pw
      _ -> nil
    end

    opts = [host: host, port: port] ++ if password, do: [password: password], else: []
    {:ok, conn} = Redix.start_link(opts)
    {:ok, conn}
  end

  def command(worker, cmd) do
    GenServer.call(worker, {:command, cmd})
  end

  def handle_call({:command, cmd}, _from, conn) do
    result = Redix.command(conn, cmd)
    {:reply, result, conn}
  end
end
