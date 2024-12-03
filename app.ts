import { App } from "deno-slack-sdk/mod.ts";
import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerTrigger from "./triggers/fb_manager_link.ts"; // Import triggers from your setup
import { Ack, Body, Respond } from "deno-slack-sdk/types.ts";

// Initialize the Slack App
const app = new App({
  token: Deno.env.get("SLACK_BOT_TOKEN"), // Your Slack Bot Token from environment variables
  signingSecret: Deno.env.get("SLACK_SIGNING_SECRET"), // Slack Signing Secret for security
});

// Add triggers to the app
app.trigger(fbManagerTrigger); // Register triggers (like shortcuts)

app.action("duplicate_ads", async ({ body, ack, respond }: { body: Body; ack: Ack; respond: Respond }) => {
  await ack(); // Acknowledge the interaction

  const userId = body.user.id;
  const clientAccountId = body.actions[0].selected_option.value;

  // Trigger a workflow for duplicating ads
  await app.client.workflows.start({
    trigger_id: body.trigger_id,
    workflow: "duplicate-ads-workflow", // Reference your workflow
    inputs: { user_id: userId, client_account_id: clientAccountId },
  });

  // Respond with confirmation
  await respond({
    text: `Starting the ad duplication process for client account: ${clientAccountId}.`,
  });
});

// Start the app to listen for interactions
await app.start();  // Initialize and start the app to listen to events
