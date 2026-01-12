## Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project adheres to **Semantic Versioning**.

## [Unreleased]

### Changed
- Updated to latest .NET 10 patch package references (10.0.1) across library and demo.
- Updated MinVer to 7.0.0.
- Updated test dependencies (bUnit + FluentAssertions).
- Refactored JS interop to pass cubic-bezier control points directly (removes CSS string formatting on the .NET side and regex parsing on the JS side).

### Fixed
- Removed legacy “Typewriter” test scaffolding and replaced it with real `AddToCart` bUnit tests (tests are now discovered and run in CI).
- Split `CreativeDemos` logic into `CreativeDemos.razor.cs` and removed repeated `new Random()` allocations.

### Internal
- Consolidated common `using` directives into `GlobalUsings.cs` in the library and test projects.

