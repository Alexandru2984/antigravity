import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit.ScalatestRouteTest
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

class ScalaServiceSpec extends AnyWordSpec with Matchers with ScalatestRouteTest {
  "ScalaService" should {
    "serve the root status payload" in {
      Get("/") ~> ScalaService.route ~> check {
        status shouldBe StatusCodes.OK
        responseAs[String] shouldBe ScalaService.StatusJson
      }
    }

    "serve a health endpoint" in {
      Get("/health") ~> ScalaService.route ~> check {
        status shouldBe StatusCodes.OK
        responseAs[String] shouldBe ScalaService.StatusJson
      }
    }

    "read PORT from the environment with a stable default" in {
      ScalaService.port(Map.empty) shouldBe 4058
      ScalaService.port(Map("PORT" -> "4060")) shouldBe 4060
    }
  }
}
