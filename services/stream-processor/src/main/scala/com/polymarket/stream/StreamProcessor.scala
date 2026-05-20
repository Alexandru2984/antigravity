package com.polymarket.stream

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.kafka.{ConsumerSettings, Subscriptions}
import akka.kafka.scaladsl.Consumer
import akka.stream.scaladsl.Sink
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import play.api.libs.json.Json
import java.sql.DriverManager
import scala.concurrent.ExecutionContext
import com.typesafe.config.ConfigFactory

object StreamProcessor extends App {
  implicit val system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "stream-processor")
  implicit val ec: ExecutionContext = system.executionContext

  val config = ConfigFactory.load()
  val kafkaBrokers = sys.env.getOrElse("KAFKA_BROKERS", "kafka:9092")
  val chUrl        = sys.env.getOrElse("CLICKHOUSE_JDBC_URL",
                       "jdbc:clickhouse://clickhouse:8123/analytics")

  val consumerSettings = ConsumerSettings(system, new StringDeserializer, new StringDeserializer)
    .withBootstrapServers(kafkaBrokers)
    .withGroupId("stream-processor")
    .withProperty(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest")

  val topics = Set(
    "listings.created", "listings.updated",
    "payments.processed", "users.registered",
    "reviews.created"
  )

  Consumer
    .plainSource(consumerSettings, Subscriptions.topics(topics))
    .map { record =>
      val topic   = record.topic()
      val payload = Json.parse(record.value())
      (topic, payload)
    }
    .runWith(Sink.foreach { case (topic, payload) =>
      val conn = DriverManager.getConnection(chUrl,
        sys.env.getOrElse("CLICKHOUSE_USER", "default"),
        sys.env.getOrElse("CLICKHOUSE_PASSWORD", ""))
      try {
        val eventType = topic.replace(".", "_")
        val entityId  = (payload \ "id").asOpt[String].getOrElse("")
        val userId    = (payload \ "user_id").asOpt[String]
          .orElse((payload \ "seller_id").asOpt[String])
          .getOrElse("")
        val meta = payload.toString()

        val stmt = conn.prepareStatement(
          "INSERT INTO analytics.events (event_type, entity_id, user_id, metadata, occurred_at) VALUES (?,?,?,?,now())"
        )
        stmt.setString(1, eventType)
        stmt.setString(2, entityId)
        stmt.setString(3, userId)
        stmt.setString(4, meta)
        stmt.execute()
        stmt.close()
        system.log.info(s"Processed event: $eventType entity=$entityId")
      } finally {
        conn.close()
      }
    })

  // Health HTTP endpoint
  import akka.http.scaladsl.Http
  import akka.http.scaladsl.server.Directives._

  val route = path("health") {
    get { complete("""{"status":"ok","service":"stream-processor"}""") }
  }

  val port = sys.env.getOrElse("PORT", "4033").toInt
  Http().newServerAt("0.0.0.0", port).bind(route)
  system.log.info(s"Stream processor running on port $port")
}
