## MODIFIED Requirements

### Requirement: Context Hygiene

The operator SHALL be able to see what is burning the context window; when the
window is close to full, the session SHALL compact or move work onto a fresh
lane.

#### Scenario: Research off the writer

- **WHEN** research needs the web
- **THEN** research runs in an isolated child that cannot write project files
- **AND** only chosen URLs are fetched deep

#### Scenario: Search substrate

- **WHEN** the agent searches file contents or names in a repository
- **THEN** results SHALL come back in bounded, paged pages with a cursor for
  the next page
- **AND** unbounded dumps of grep hits SHALL NOT be written into the
  transcript