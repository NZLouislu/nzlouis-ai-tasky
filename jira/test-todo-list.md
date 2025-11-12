## Backlog

- Story: Install and Configure jira2md and jira-client Dependencies
  Description: Add the required npm packages (jira2md, jira-client, @types/jira-client) to the project and verify compatibility with existing TypeScript configuration and build setup.
  Acceptance_Criteria:
    - [ ] Install jira2md package (^3.1.0 or latest stable)
    - [ ] Install jira-client package (^8.2.2 or latest stable)
    - [ ] Install @types/jira-client dev dependency for TypeScript support
    - [ ] Update package.json with correct version constraints
    - [ ] Verify no dependency conflicts with existing packages
    - [ ] Run `npm install` successfully without errors
    - [ ] Verify TypeScript can resolve type definitions
    - [ ] Update package-lock.json
  Priority: High
  Labels: [dependencies, setup, typescript]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Create JiraClientWrapper for API Abstraction
  Description: Implement a wrapper class around jira-client that provides a clean interface matching our existing JiraProvider API while leveraging jira-client's robust features for authentication, error handling, and API calls.
  Acceptance_Criteria:
    - [ ] Create `src/jira/jira-client-wrapper.ts` file
    - [ ] Implement JiraClientWrapper class with constructor accepting JiraConfig
    - [ ] Parse jiraUrl to extract protocol and host for jira-client initialization
    - [ ] Implement getProject() method wrapping client.getProject()
    - [ ] Implement searchIssues() method wrapping client.searchJira() with field selection
    - [ ] Implement createIssue() method wrapping client.addNewIssue()
    - [ ] Implement updateIssue() method wrapping client.updateIssue()
    - [ ] Implement getTransitions() method wrapping client.listTransitions()
    - [ ] Implement transitionIssue() method wrapping client.transitionIssue()
    - [ ] Implement findTransitionByName() helper method
    - [ ] Add proper TypeScript types for all methods
    - [ ] Include JSDoc documentation for public methods
  Priority: High
  Labels: [api, wrapper, jira-client]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Implement FormatConverter Using jira2md
  Description: Create a comprehensive format conversion utility that leverages jira2md for bidirectional conversion between Markdown, Jira Wiki Syntax, and Atlassian Document Format (ADF), with proper handling of rich text formatting.
  Acceptance_Criteria:
    - [ ] Create `src/jira/format-converter.ts` file
    - [ ] Implement FormatConverter class
    - [ ] Add markdownToJira() method using j2m.to_jira()
    - [ ] Add jiraToMarkdown() method using j2m.to_markdown()
    - [ ] Add markdownToHtml() method using j2m.md_to_html()
    - [ ] Add jiraToHtml() method using j2m.jira_to_html()
    - [ ] Implement markdownToADF() method with Jira Wiki → ADF conversion
    - [ ] Implement adfToMarkdown() method with ADF → Jira Wiki conversion
    - [ ] Add private helper methods for ADF node parsing (heading, paragraph, list, code)
    - [ ] Handle bold, italic, code, links, and lists in ADF conversion
    - [ ] Add comprehensive unit tests for all conversion methods
    - [ ] Test edge cases (empty strings, special characters, nested formatting)
  Priority: High
  Labels: [format, conversion, jira2md, adf]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update md-to-jira.ts to Use New Libraries
  Description: Refactor the md-to-jira module to use JiraClientWrapper for API calls and FormatConverter for format conversion, replacing all custom fetch calls and ADF conversion logic.
  Acceptance_Criteria:
    - [ ] Import JiraClientWrapper and FormatConverter
    - [ ] Replace JiraProvider instantiation with JiraClientWrapper
    - [ ] Replace convertToADF() calls with converter.markdownToADF()
    - [ ] Update createIssueFromStory() to use new wrapper methods
    - [ ] Update updateIssueFromStory() to use new wrapper methods
    - [ ] Ensure status transition logic works with new API wrapper
    - [ ] Maintain backward compatibility with existing options interface
    - [ ] Preserve all logging and error handling behavior
    - [ ] Update imports and remove deprecated functions
    - [ ] Verify dry-run mode still works correctly
  Priority: High
  Labels: [refactor, md-to-jira, api-integration]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update jira-to-md.ts to Use New Libraries
  Description: Refactor the jira-to-md module to use JiraClientWrapper for fetching issues and FormatConverter for converting ADF descriptions to Markdown, improving format fidelity.
  Acceptance_Criteria:
    - [ ] Import JiraClientWrapper and FormatConverter
    - [ ] Replace JiraProvider instantiation with JiraClientWrapper
    - [ ] Replace extractPlainTextFromADF() with converter.adfToMarkdown()
    - [ ] Update mapIssueToStory() to use new conversion methods
    - [ ] Ensure all issue fields are properly extracted (summary, status, labels, etc.)
    - [ ] Maintain support for subtasks to todos conversion
    - [ ] Preserve assignee extraction logic
    - [ ] Keep metadata extraction (priority, created, updated)
    - [ ] Verify JQL query handling remains functional
    - [ ] Test with various issue types and field configurations
  Priority: High
  Labels: [refactor, jira-to-md, format-conversion]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update Platform Factory to Support New Implementation
  Description: Modify the platform factory and types to work seamlessly with the new library-based implementation while maintaining the abstraction layer for potential future platform additions.
  Acceptance_Criteria:
    - [ ] Review `src/platform/factory.ts` for compatibility
    - [ ] Update PlatformFactory.exportToMarkdown() if needed
    - [ ] Update PlatformFactory.importFromMarkdown() if needed
    - [ ] Ensure validateConfig() works with new implementation
    - [ ] Verify logger integration with new wrapper classes
    - [ ] Test dry-run mode through platform factory
    - [ ] Maintain backward compatibility with existing CLI tools
    - [ ] Update platform types if necessary
  Priority: Medium
  Labels: [platform, factory, integration]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Create Unit Tests for JiraClientWrapper
  Description: Develop comprehensive unit tests for the JiraClientWrapper class, mocking jira-client to verify correct API usage, error handling, and data transformation.
  Acceptance_Criteria:
    - [ ] Create `src/jira/__tests__/jira-client-wrapper.test.ts`
    - [ ] Mock jira-client module using jest.mock()
    - [ ] Test constructor properly initializes client with config
    - [ ] Test getProject() returns expected data structure
    - [ ] Test searchIssues() with various JQL queries and pagination
    - [ ] Test createIssue() with valid and invalid payloads
    - [ ] Test updateIssue() with partial updates
    - [ ] Test getTransitions() returns transition list
    - [ ] Test transitionIssue() executes transitions correctly
    - [ ] Test findTransitionByName() finds transitions by name and target status
    - [ ] Test error handling for API failures (401, 403, 404, 500)
    - [ ] Achieve >90% code coverage for wrapper class
  Priority: High
  Labels: [testing, unit-test, jira-client]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Create Unit Tests for FormatConverter
  Description: Build extensive unit tests for the FormatConverter class, validating all conversion paths and ensuring format fidelity for common Markdown patterns.
  Acceptance_Criteria:
    - [ ] Create `src/jira/__tests__/format-converter.test.ts`
    - [ ] Test markdownToJira() with headers, bold, italic, lists, code blocks
    - [ ] Test jiraToMarkdown() with Jira Wiki syntax elements
    - [ ] Test markdownToHtml() produces valid HTML
    - [ ] Test jiraToHtml() produces valid HTML
    - [ ] Test markdownToADF() creates valid ADF structure
    - [ ] Test adfToMarkdown() extracts text from ADF nodes
    - [ ] Test round-trip conversions (Markdown → Jira → Markdown)
    - [ ] Test edge cases (empty strings, special characters, nested lists)
    - [ ] Test complex formatting combinations
    - [ ] Verify ADF node types (paragraph, heading, bulletList, codeBlock)
    - [ ] Achieve >95% code coverage for converter class
  Priority: High
  Labels: [testing, unit-test, format-conversion]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update Integration Tests for md-to-jira
  Description: Modify existing integration tests for md-to-jira to work with the new library-based implementation, ensuring end-to-end functionality with mocked Jira API responses.
  Acceptance_Criteria:
    - [ ] Update `src/jira/__tests__/md-to-jira.test.ts` if exists
    - [ ] Mock JiraClientWrapper methods instead of fetch
    - [ ] Test complete workflow: parse MD → convert format → create issue
    - [ ] Test status transition after issue creation
    - [ ] Test label assignment
    - [ ] Test dry-run mode doesn't create issues
    - [ ] Test error handling for API failures
    - [ ] Test multiple stories in single file
    - [ ] Verify correct ADF format in API payloads
    - [ ] Test with various Markdown formatting (bold, lists, code)
  Priority: High
  Labels: [testing, integration-test, md-to-jira]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update Integration Tests for jira-to-md
  Description: Enhance integration tests for jira-to-md to validate the new format conversion pipeline and ensure exported Markdown files maintain proper formatting.
  Acceptance_Criteria:
    - [ ] Update `src/jira/__tests__/jira-to-md.test.ts` if exists
    - [ ] Mock JiraClientWrapper.searchIssues() with realistic responses
    - [ ] Test complete workflow: fetch issues → convert ADF → render MD
    - [ ] Test JQL query construction and filtering
    - [ ] Test subtasks to todos conversion
    - [ ] Test assignee extraction
    - [ ] Test metadata preservation (priority, dates)
    - [ ] Verify Markdown output format matches expected structure
    - [ ] Test with various ADF structures (paragraphs, lists, headings)
    - [ ] Test filename generation and sanitization
  Priority: High
  Labels: [testing, integration-test, jira-to-md]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Create Example Scripts Using New Implementation
  Description: Develop example scripts in the examples/ directory demonstrating how to use the upgraded library with real-world scenarios, replacing old examples.
  Acceptance_Criteria:
    - [ ] Create `examples/export-jira-to-markdown.ts` using new API
    - [ ] Create `examples/import-markdown-to-jira.ts` using new API
    - [ ] Create `examples/format-conversion-demo.ts` showing jira2md usage
    - [ ] Create `examples/batch-sync-example.ts` for bulk operations
    - [ ] Add comprehensive comments explaining each step
    - [ ] Include error handling examples
    - [ ] Show how to use custom status mappings
    - [ ] Demonstrate JQL query customization
    - [ ] Add example .env.example file with all required variables
    - [ ] Update examples/README.md with usage instructions
  Priority: Medium
  Labels: [examples, documentation]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update CLI Tools to Use New Implementation
  Description: Refactor CLI tools (sync-cli.ts, validate-config-cli.ts) to work with the new library-based implementation, ensuring all command-line features remain functional.
  Acceptance_Criteria:
    - [ ] Review `src/cli/sync-cli.ts` for compatibility
    - [ ] Update imports to use new wrapper classes
    - [ ] Ensure export command works with JiraClientWrapper
    - [ ] Ensure import command works with FormatConverter
    - [ ] Verify validate command tests API connectivity
    - [ ] Test all CLI flags and options (--dry-run, --jql, etc.)
    - [ ] Update CLI help text if needed
    - [ ] Test error messages are user-friendly
    - [ ] Verify exit codes are correct
  Priority: Medium
  Labels: [cli, refactor]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Perform End-to-End Testing with Real Jira Instance
  Description: Execute comprehensive end-to-end tests against a real Jira test instance to validate the complete upgrade, including authentication, API calls, and format conversion.
  Acceptance_Criteria:
    - [ ] Set up test Jira project with sample issues
    - [ ] Configure .env with test Jira credentials
    - [ ] Test export: Jira → Markdown with various issue types
    - [ ] Verify exported Markdown files have correct formatting
    - [ ] Test import: Markdown → Jira creates issues correctly
    - [ ] Verify created issues in Jira have proper formatting
    - [ ] Test status transitions work correctly
    - [ ] Test label assignment and retrieval
    - [ ] Test subtasks/todos synchronization
    - [ ] Test with issues containing rich formatting (bold, lists, code)
    - [ ] Test error scenarios (invalid credentials, missing project)
    - [ ] Document any format conversion limitations discovered
  Priority: High
  Labels: [testing, e2e, validation]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Update Documentation and README
  Description: Comprehensively update all project documentation to reflect the new library-based implementation, including API changes, new features, and migration guide.
  Acceptance_Criteria:
    - [ ] Update main README.md with new architecture overview
    - [ ] Document jira2md and jira-client integration
    - [ ] Update API documentation for JiraClientWrapper
    - [ ] Update API documentation for FormatConverter
    - [ ] Add migration guide from old to new implementation
    - [ ] Update environment variable documentation
    - [ ] Document supported Markdown formats
    - [ ] Document ADF conversion capabilities and limitations
    - [ ] Add troubleshooting section for common issues
    - [ ] Update code examples in documentation
    - [ ] Add badges for dependencies
    - [ ] Update CHANGELOG.md with upgrade details
  Priority: Medium
  Labels: [documentation]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Fix TypeScript Build Errors
  Description: Resolve all TypeScript compilation errors that may arise from the refactoring, ensuring strict type safety and proper type inference throughout the codebase.
  Acceptance_Criteria:
    - [ ] Run `npm run build` and identify all TypeScript errors
    - [ ] Fix type mismatches in JiraClientWrapper
    - [ ] Fix type mismatches in FormatConverter
    - [ ] Ensure proper typing for jira-client methods
    - [ ] Add missing type definitions where needed
    - [ ] Fix any `any` types with proper interfaces
    - [ ] Resolve import/export type errors
    - [ ] Ensure strict null checks pass
    - [ ] Verify no implicit any errors
    - [ ] Run `npm run build` successfully with zero errors
  Priority: High
  Labels: [typescript, build, bugfix]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Fix Failing Unit Tests
  Description: Address all unit test failures resulting from the refactoring, updating mocks, assertions, and test data to match the new implementation.
  Acceptance_Criteria:
    - [ ] Run `npm test` and identify all failing tests
    - [ ] Update mocks for JiraProvider to JiraClientWrapper
    - [ ] Update test assertions for new format conversion
    - [ ] Fix tests in markdown-parser.test.ts if affected
    - [ ] Fix tests in renderer.test.ts if affected
    - [ ] Fix tests in status-normalizer.test.ts if affected
    - [ ] Update snapshot tests if format changed
    - [ ] Ensure all existing tests pass
    - [ ] Verify test coverage remains >80%
    - [ ] Run `npm test` successfully with all tests passing
  Priority: High
  Labels: [testing, bugfix]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Performance Testing and Optimization
  Description: Conduct performance testing to ensure the new library-based implementation doesn't introduce performance regressions and optimize any bottlenecks discovered.
  Acceptance_Criteria:
    - [ ] Benchmark export performance (time to export 100 issues)
    - [ ] Benchmark import performance (time to import 100 stories)
    - [ ] Benchmark format conversion performance
    - [ ] Compare performance with old implementation
    - [ ] Identify any performance regressions
    - [ ] Optimize slow conversion operations if needed
    - [ ] Test with large issue descriptions (>10KB)
    - [ ] Test with batch operations (>500 issues)
    - [ ] Verify memory usage is acceptable
    - [ ] Document performance characteristics
  Priority: Medium
  Labels: [performance, optimization]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Security Audit and Credential Handling
  Description: Review security aspects of the upgrade, ensuring API tokens are handled securely and no sensitive data is logged or exposed.
  Acceptance_Criteria:
    - [ ] Verify API tokens are not logged in debug output
    - [ ] Ensure .env file is in .gitignore
    - [ ] Review error messages don't expose credentials
    - [ ] Verify HTTPS is enforced for Jira API calls
    - [ ] Check for any hardcoded credentials in code
    - [ ] Review dependency vulnerabilities with `npm audit`
    - [ ] Fix any high/critical security issues
    - [ ] Document security best practices in README
    - [ ] Add security section to documentation
  Priority: High
  Labels: [security, audit]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Backward Compatibility Testing
  Description: Ensure the upgrade maintains backward compatibility with existing workflows, configurations, and exported files to prevent breaking changes for current users.
  Acceptance_Criteria:
    - [ ] Test with existing .env configurations
    - [ ] Verify old Markdown files can still be imported
    - [ ] Test with existing status mappings
    - [ ] Ensure CLI commands work with same syntax
    - [ ] Verify exported file format is compatible
    - [ ] Test with existing example scripts
    - [ ] Check platform factory maintains same interface
    - [ ] Verify no breaking changes in public API
    - [ ] Document any intentional breaking changes
    - [ ] Create migration script if needed
  Priority: High
  Labels: [compatibility, testing]
  Assignees: Louis Lu
  Reporter: Louis Lu

- Story: Final Validation and Release Preparation
  Description: Perform final comprehensive validation of the entire upgrade, run all tests, build the project, and prepare for release with proper versioning and changelog.
  Acceptance_Criteria:
    - [ ] Run `npm test` - all tests must pass
    - [ ] Run `npm run build` - build must succeed with zero errors
    - [ ] Run `npm run lint` - no linting errors
    - [ ] Verify all examples work correctly
    - [ ] Test CLI commands end-to-end
    - [ ] Review all code changes for quality
    - [ ] Update version number in package.json (semantic versioning)
    - [ ] Update CHANGELOG.md with all changes
    - [ ] Create git tag for release
    - [ ] Prepare release notes
    - [ ] Update npm package if publishing
    - [ ] Archive old implementation in separate branch
  Priority: High
  Labels: [release, validation]
  Assignees: Louis Lu
  Reporter: Louis Lu

