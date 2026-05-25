namespace ConfigService.Tests

open System
open ConfigService.FeatureFlags
open Xunit

module FeatureFlagsTests =

    [<Fact>]
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
