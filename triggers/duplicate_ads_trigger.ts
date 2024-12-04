import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import duplicateAdWorkflow from "../workflows/duplicate_ads_workflow.ts";
// import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";

// Handle button interaction (duplicate_ads)
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
  workflow: `#/workflows/${clientAccountSelectWorkflow.definition.callback_id}`, // Reference the client account selection workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Extract user_id from context
    client_account_id: { value: TriggerContextData.Shortcut.interactivity }, // Use the selected value from the dropdown or interaction
  },
};

export {
  clientAccountSelectTrigger,
  duplicateAdsTrigger,
  loginButtonClickTrigger,
};
