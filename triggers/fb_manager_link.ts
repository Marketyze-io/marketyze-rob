import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const fbManagerTrigger: Trigger<typeof fbManagerWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // The type of trigger (e.g., shortcut)
  name: "Open FB Marketing Manager", // The name of the shortcut
  workflow: `#/workflows/${fbManagerWorkflow.definition.callback_id}`, // Reference the workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    // Pass client_account_id through the workflow trigger manually, if it's relevant to the context
    // Example: client_account_id: { value: some_value }  // Define where to get this value
  },
};

// Handle button interaction (duplicate_ads)
export const duplicateAdsTrigger: Trigger = {
  type: TriggerTypes.Shortcut, // Action trigger type
  name: "duplicate_ads", // Name of the action
  workflow: "#/workflows/duplicate-ads-workflow", // Reference the workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Extract user_id from context
    client_account_id: { value: TriggerContextData.Shortcut.interactivity }, // Adjust to where client_account_id comes from
  },
};

// Handle button interaction (login_button_click)
export const loginButtonClickTrigger: Trigger = {
  type: TriggerTypes.Shortcut, // Trigger type for button click
  name: "login_button_click", // Name of the action
  workflow: "#/workflows/fb-manager-workflow", // Reference to the Facebook manager workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Get user ID from context
    channel_id: { value: TriggerContextData.Shortcut.channel_id }, // Get channel ID
    interactivity: { value: TriggerContextData.Shortcut.interactivity }, // Get action ID from interaction
    fbAccessTokenId: { value: "fb-access-token" }, // Example: replace with the actual OAuth token
  },
};

// Handle client account selection
export const clientAccountSelectTrigger: Trigger = {
  type: TriggerTypes.Shortcut, // Action trigger type
  name: "client_account_select", // Name of the action
  workflow: "#/workflows/client-account-selection-workflow", // Reference the client account selection workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id }, // Extract user_id from context
    client_account_id: { value: TriggerContextData.Shortcut.interactivity }, // Use the selected value from the dropdown or interaction
  },
};

export default fbManagerTrigger;
