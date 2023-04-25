# Project Calamity (Brain)
This is the brain and web UI to control Project Calamity.

## Using Tunnel to develop with Rust plugins
Using the `yarn dev:tunnel` command, you can have your local dev server run at a consistent URL, and setup your Rust server's CAControl so it connects to it, making it easy to connect your Rust server to your local dev brain.

1. Request an Ngrok auth token from Carlos.
2. Add the auth token to your environment as `NGROK_AUTH_TOKEN`, and choose a subdomain for your tunnel as `NGROK_SUBDOMAIN` (https://{yoursubdomain}.ngrok.io). **DO NOT** put these in a `.env` file or anything in the repo, put them in your machine's environment.
3. Run `yarn dev:tunnel` to start your local brain server.
4. Add a file a file in your `calamity-rust` repo on your Rust server at `oxide/config/CAControl.json` with your tunnel URL:
```json
{
  "brain_url": "https://{yoursubdomain}.ngrok.io"
}
```
5. Restart your Rust server

Now, your Rust server should connect to your local dev brain server, as long as it is running!

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
