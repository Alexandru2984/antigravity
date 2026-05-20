name := "stream-processor"
version := "0.1.0"
scalaVersion := "2.13.13"

resolvers += "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots"

libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-stream-kafka" % "3.0.1",
  "com.typesafe.akka" %% "akka-stream" % "2.6.19",
  "com.typesafe.play" %% "play-json" % "2.9.4",
  "org.slf4j" % "slf4j-api" % "1.7.36",
  "ch.qos.logback" % "logback-classic" % "1.2.11"
)
