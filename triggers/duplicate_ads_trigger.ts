import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
// import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";
import duplicateAdWorkflow from "../workflows/duplicate_ad_workflow.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import clientAccountSelectWorkflow from "../workflows/client_account_selection_workflow.ts";

// Handle button interaction (duplicate_ads)
const duplicateAdsTrigger: Trigger<typeof duplicateAdWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // Action trigger type (e.g., shortcut)
  name: "duplicate_ads", // Name of the action
  workflow: `#/workflows/${duplicateAdWorkflow.definition.callback_id}`, // Reference the workflow using callback_id
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Extract user_id from context
    channel_id: { value: TriggerContextData.Shortcut.channel_id }, // Extract channel_id from context
    interactivity: { value: TriggerContextData.Shortcut.interactivity }, // Extract interactivity from context
    ad_id: { value: TriggerContextData.Shortcut.interactivity }, // Ensure this matches what the workflow needs
  },
};

// Handle button interaction (login_button_click)
const loginButtonClickTrigger: Trigger<typeof fbManagerWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // Trigger type for button click
  name: "login_button_click", // Name of the action
  workflow: `#/workflows/${fbManagerWorkflow.definition.callback_id}`, // Reference to the Facebook manager workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    fbAccessTokenId: { value: "fb-access-token" }, // OAuth token (ensure this is valid)
  },
};

// Handle client account selection
const clientAccountSelectTrigger: Trigger<
  typeof clientAccountSelectWorkflow.definition
> = {
  type: TriggerTypes.Shortcut, // Action trigger type
  name: "client_account_select", // Name of the action
  workflow: `#/workflows/${clientAccountSelectWorkflow.definition.callback_id}`, // Reference to the client account selection workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Extract user_id from context
    channel_id: { value: TriggerContextData.Shortcut.channel_id }, // Extract channel_id from context
    interactivity: { value: TriggerContextData.Shortcut.interactivity }, // Pointer to user input
  },
};

export {
  clientAccountSelectTrigger,
  duplicateAdsTrigger,
  loginButtonClickTrigger,
};

// import { WebClient } from "@slack/web-api";

// // Create a new instance of the WebClient to interact with Slack
// const web = new WebClient(process.env.SLACK_TOKEN);

// // Trigger the duplicate ad workflow programmatically
// await web.workflows.trigger({
//   workflow_id: "duplicate-ad-workflow", // ID of the workflow you've defined
//   inputs: {
//     user_id: "<user_id>", // Pass the user's ID triggering the workflow
//     channel_id: "<channel_id>", // Channel where the workflow is triggered
//     interactivity: true, // Indicating interactivity needed
//     ad_id: "<ad_id>", // The Facebook Ad ID to duplicate
//   },
// });
