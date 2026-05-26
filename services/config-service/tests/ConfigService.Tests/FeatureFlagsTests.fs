namespace ConfigService.Tests

open System
open ConfigService.FeatureFlags
open Xunit

module FeatureFlagsTests =

    [<Theory>]
    [<InlineData(true, """{"enabled":true}""")>]
    [<InlineData(false, """{"enabled":false}""")>]
    let ``serializeFlagValue writes the storage json shape`` (enabled: bool, expected: string) =
        Assert.Equal(expected, serializeFlagValue enabled)

    [<Fact>]
    [<Trait("Category", "Integration")>]
    let ``upsert writes and reads feature flags using the init sql schema`` () =
        let name = "test-flag-" + Guid.NewGuid().ToString("N")

        ensureSchema ()
        deleteByName name
        upsert name true "enabled from test"

        let flag = getByName name

        deleteByName name

        match flag with
        | Some value ->
            Assert.Equal(name, value.Name)
            Assert.True(value.Enabled)
            Assert.Equal("enabled from test", value.Description)
        | None -> failwith "expected feature flag to be persisted"
