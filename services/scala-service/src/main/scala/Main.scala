import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object ScalaService {
  val StatusJson = "{\"status\":\"ok\", \"service\":\"scala-akka-http\"}"

  def route: Route =
    concat(
      pathSingleSlash {
        get {
          complete(HttpEntity(ContentTypes.`application/json`, StatusJson))
        }
      },
      path("health") {
        get {
          complete(HttpEntity(ContentTypes.`application/json`, StatusJson))
        }
      }
    )

  def port(env: Map[String, String]): Int =
    env.getOrElse("PORT", "4058").toInt
}

object Main {
  def main(args: Array[String]): Unit = {
    implicit val system = ActorSystem("scala-system")
    Http().newServerAt("0.0.0.0", ScalaService.port(sys.env)).bind(ScalaService.route)
  }
}
