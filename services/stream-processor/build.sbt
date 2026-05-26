name := "stream-processor"
version := "0.1.0"
scalaVersion := "2.13.13"

val AkkaVersion = "2.6.19"
val AkkaHttpVersion = "10.2.9"

libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-actor-typed" % AkkaVersion,
  "com.typesafe.akka" %% "akka-stream" % AkkaVersion,
  "com.typesafe.akka" %% "akka-http" % AkkaHttpVersion,
  "com.typesafe.akka" %% "akka-stream-kafka" % "3.0.1",
  "com.typesafe.play" %% "play-json" % "2.9.4",
  "org.slf4j" % "slf4j-api" % "1.7.36",
  "ch.qos.logback" % "logback-classic" % "1.2.11",
  "org.scalatest" %% "scalatest" % "3.2.18" % Test
)

Compile / mainClass := Some("com.polymarket.stream.StreamProcessor")
assembly / mainClass := Some("com.polymarket.stream.StreamProcessor")
assembly / assemblyJarName := "stream-processor.jar"
assembly / test := (Test / test).value
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".sf")) =>
    MergeStrategy.discard
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".dsa")) =>
    MergeStrategy.discard
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".rsa")) =>
    MergeStrategy.discard
  case PathList("module-info.class") => MergeStrategy.discard
  case PathList("reference.conf") => MergeStrategy.concat
  case PathList("version.conf")   => MergeStrategy.concat
  case x                          => (assembly / assemblyMergeStrategy).value(x)
}
