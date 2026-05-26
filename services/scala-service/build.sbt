name := "scala-service"
version := "0.1"
scalaVersion := "2.13.12"

val AkkaVersion = "2.6.20"
val AkkaHttpVersion = "10.2.10"

libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-http" % AkkaHttpVersion,
  "com.typesafe.akka" %% "akka-stream" % AkkaVersion,
  "com.typesafe.akka" %% "akka-http-testkit" % AkkaHttpVersion % Test,
  "com.typesafe.akka" %% "akka-testkit" % AkkaVersion % Test,
  "org.scalatest" %% "scalatest" % "3.2.18" % Test
)

Compile / mainClass := Some("Main")
assembly / mainClass := Some("Main")
assembly / assemblyJarName := "scala-service.jar"
assembly / test := (Test / test).value
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".sf")) =>
    MergeStrategy.discard
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".dsa")) =>
    MergeStrategy.discard
  case PathList("META-INF", xs @ _*) if xs.exists(_.toLowerCase.endsWith(".rsa")) =>
    MergeStrategy.discard
  case PathList("module-info.class") => MergeStrategy.discard
  case PathList("reference.conf")    => MergeStrategy.concat
  case x                             => (assembly / assemblyMergeStrategy).value(x)
}
