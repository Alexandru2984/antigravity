package com.polymarket.stream

import org.scalatest.funsuite.AnyFunSuite
import play.api.libs.json.Json

class StreamProcessorSupportSpec extends AnyFunSuite {
  test("eventType converts Kafka topic names to analytics event names") {
    assert(
      StreamProcessorSupport.eventType("listings.created") == "listings_created"
    )
    assert(
      StreamProcessorSupport.eventType(
        "payments.processed"
      ) == "payments_processed"
    )
  }

  test("userId prefers user_id and falls back to seller_id") {
    assert(
      StreamProcessorSupport.userId(
        Json.parse("""{"user_id":"user-1","seller_id":"seller-1"}""")
      ) == "user-1"
    )
    assert(
      StreamProcessorSupport.userId(
        Json.parse("""{"seller_id":"seller-2"}""")
      ) == "seller-2"
    )
    assert(
      StreamProcessorSupport.userId(Json.parse("""{"id":"event-1"}""")) == ""
    )
  }
}
