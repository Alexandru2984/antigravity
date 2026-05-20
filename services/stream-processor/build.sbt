ThisBuild / version := "0.1.0"
ThisBuild / scalaVersion := "2.13.14"
ThisBuild / organization := "com.polymarket"

lazy val root = (project in file("."))
  .settings(
    name := "stream-processor",
    libraryDependencies ++= Seq(
      "com.typesafe.akka"   %% "akka-stream"          % "2.8.6",
      "com.typesafe.akka"   %% "akka-actor-typed"     % "2.8.6",
      "com.typesafe.akka"   %% "akka-http"            % "10.5.3",
      "com.typesafe.akka"   %% "akka-stream-kafka"    % "5.0.0",
      "com.clickhouse"       % "clickhouse-jdbc"       % "0.6.3",
      "com.typesafe.play"   %% "play-json"            % "2.10.6",
      "ch.qos.logback"       % "logback-classic"      % "1.4.14",
      "io.opentelemetry"     % "opentelemetry-sdk"    % "1.43.0",
    ),
    assembly / mainClass := Some("com.polymarket.stream.StreamProcessor"),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", _*) => MergeStrategy.discard
      case "reference.conf"         => MergeStrategy.concat
      case _                        => MergeStrategy.first
    },
  )
