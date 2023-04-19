# Project Calamity (Brain)
This is the brain and web UI to control Project Calamity.

## Thinking Architecture
The AI is composed of several GPT-based agent "subsystems", orchestrated using "signals". Each subsystem can influence the game world, and retrieve data using "actions".

Example subsystems:
- Overlord (special, meant to coordinate the other subsystems)
- Military
- Logistics
- Intelligence
- Human Resources (creates and maintains the characters)

When an inbound signal message is received, a "Thought Process" is created for that subsystem, which is a series of signals and actions, in a Q&A format, to respond to the initial signal, terminated by exausting necessary actions.
- Subsystems can communicate to each other using actions that create inbound signals.
- Subsystems can communicate with the Rust plugins using actions that create outbound signals.
- Subsystems can receive responses from the Rust plugins (confirmations of action, or some information retrieval, for example) with actions that watch for inbound response signals (where the `response_to` SQL column is set to the action's ID).

```mermaid
graph TD
  A[Inbound Signals] -->|direction: in| B(Thought Processes)
  A1[External Source] -->|Rust Plugins or passage of time etc| A
  A2[Other Subsystems] --> A
  B -->|generates| C[Actions]
  C -->|responds| B
  C --> D[Outbound Signals]
  D -->|direction: out| E[Rust Plugins]
  E --> F[Response Signals]
  F -->|direction: in, response_to: action ID| C
```
