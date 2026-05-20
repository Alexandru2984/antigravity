import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import scala.io.StdIn

object Main {
  def main(args: Array[String]): Unit = {
    implicit val system = ActorSystem("scala-system")
    val route = pathSingleSlash {
      get {
        complete(HttpEntity(ContentTypes.`application/json`, "{\"status\":\"ok\", \"service\":\"scala-akka-http\"}"))
      }
    }
    Http().newServerAt("0.0.0.0", 4058).bind(route)
  }
}
