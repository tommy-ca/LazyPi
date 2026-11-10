# Installer specification

## ADDED Requirements

### Requirement: Ask User documentation accuracy

The Ask User page and the `pi-ask-user` catalog hint SHALL describe the supported question shapes and configuration surface, and SHALL keep the non-approval framing.

#### Scenario: Question shapes

- **WHEN** users read the Ask User page or the catalog hint
- **THEN** both SHALL present a single focused question and a batch of 2-4 independent questions
- **AND** the page SHALL say that a batch shows a review page before submitting
- **AND** the page SHALL say that a question depending on another answer belongs in a later call

#### Scenario: Configuration precedence

- **WHEN** users read the Ask User page
- **THEN** it SHALL name `~/.pi/agent/ask-user.json` as the settings file
- **AND** it SHALL state that per-call parameters override environment variables and environment variables override the settings file
- **AND** it SHALL state that an invalid JSON settings file fails the call with its path in the error

#### Scenario: Event sharing stays opt-in

- **WHEN** users read the Ask User page
- **THEN** it SHALL state that `emitFullEvents` shares answers and prompt context with other installed extensions
- **AND** it SHALL state that the default is off

#### Scenario: Non-approval framing is preserved

- **WHEN** the Ask User page and catalog hint are read
- **THEN** the hint SHALL retain a "not hard approval" clause
- **AND** the page SHALL retain the statement that registration does not establish native loading, unattended denial, child authorization, or readiness
