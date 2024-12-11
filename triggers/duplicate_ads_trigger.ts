import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
// import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";
import duplicateAdWorkflow from "../workflows/duplicate_ad_workflow.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";

// Handle button interaction (duplicate_ads)
const duplicateAdsTrigger: Trigger<typeof duplicateAdWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // Trigger type
  name: "Duplicate Ads Workflow", // Name of the action
  workflow: `#/workflows/${duplicateAdWorkflow.definition.callback_id}`, // Reference the workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    ad_id: { value: TriggerContextData.Shortcut.interactivity }, // Pass interactivity pointer if needed
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

export default { duplicateAdsTrigger, loginButtonClickTrigger };
