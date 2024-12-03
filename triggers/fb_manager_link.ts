import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

// Shortcut trigger that starts the workflow
const fbManagerTrigger: Trigger<typeof fbManagerWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // Shortcut trigger type
  name: "Open FB Marketing Manager", // The name of the shortcut
  workflow: `#/workflows/${fbManagerWorkflow.definition.callback_id}`, // Point to the workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
  },
};

// Handle slash command request
app.action("duplicate_ads", async ({ body, ack, respond }) => {
  await ack();

  const userId = body.user.id;
  const clientAccountId = body.actions[0].selected_option.value;

  // Trigger a workflow for duplicating ads
  await app.client.workflows.start({
    trigger_id: body.trigger_id,
    workflow: "duplicate-ads-workflow", // Reference the appropriate workflow
    inputs: {
      user_id: userId,
      client_account_id: clientAccountId,
    },
  });

  // Respond to the user to confirm the action
  await respond({
    text:
      `Starting the ad duplication process for client account: ${clientAccountId}.`,
  });
});

// Handle button interaction (login_button_click)
app.action("login_button_click", async ({ body, ack, respond }) => {
  await ack(); // Acknowledge the action immediately

  // You can use `app.client.workflows.start` to trigger a workflow
  await app.client.workflows.start({
    trigger_id: body.trigger_id, // Pass the trigger_id from the interaction
    workflow: "fb-manager-workflow", // Specify the workflow callback_id
    inputs: {
      user_id: body.user.id, // User who clicked the button
      channel_id: body.channel.id, // Channel where the interaction took place
      interactivity: true, // Flag if interaction is needed
      fbAccessTokenId: body.user.id, // Facebook access token
    },
  });

  // Respond with a message or feedback
  await respond({
    text: "Starting the Facebook Manager workflow...",
  });
});

// Handle client account selection
app.action("client_account_select", async ({ body, ack, respond }) => {
  await ack(); // Acknowledge the interaction

  const selectedClientAccountId = body.actions[0].selected_option.value;
  const userId = body.user.id;

  // Trigger a workflow for handling the selected client account
  await app.client.workflows.start({
    trigger_id: body.trigger_id,
    workflow: "client-account-selection-workflow", // Reference the workflow
    inputs: {
      user_id: userId,
      client_account_id: selectedClientAccountId,
    },
  });

  // Respond with confirmation
  await respond({
    text:
      `Selected client account: ${selectedClientAccountId}. Processing your request.`,
  });
});

export default fbManagerTrigger;
