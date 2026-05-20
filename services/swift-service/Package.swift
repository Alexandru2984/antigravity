// swift-tools-version:5.8
import PackageDescription
let package = Package(
    name: "swift-service",
    platforms: [.macOS(.v12)],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "4.76.0"),
    ],
    targets: [
        .executableTarget(name: "App", dependencies: [
            .product(name: "Vapor", package: "vapor")
        ]),
    ]
)
