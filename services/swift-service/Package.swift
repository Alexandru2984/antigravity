// swift-tools-version:5.8
import PackageDescription
let package = Package(
    name: "swift-service",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(name: "App"),
    ]
)
