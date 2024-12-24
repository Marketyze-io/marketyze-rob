import { Trigger } from "deno-slack-sdk/types.ts";
import sayHiWorkflow from "../workflows/say_hi_workflow.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";

// import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";
import duplicateAdWorkflow from "../workflows/duplicate_ad_workflow.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";

const mentionTrigger: Trigger<typeof sayHiWorkflow.definition> = {
  type: TriggerTypes.Event,
  name: "Say Hi!",
  description: "responds to a mention",
  workflow: `#/workflows/${sayHiWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.AppMentioned,
    all_resources: true,
  },
  inputs: {
    user_id: {
      value: TriggerContextData.Event.AppMentioned.user_id,
    },
    channel_id: {
      value: TriggerContextData.Event.AppMentioned.channel_id,
    },
  },
};

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

const fbManagerDevTrigger: Trigger<typeof fbManagerDevWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "FB Manager (Dev Mode)",
  workflow: `#/workflows/${fbManagerDevWorkflow.definition.callback_id}`,
  inputs: {
    user_id: {
      value: TriggerContextData.Shortcut.user_id,
    },
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
  },
};

// Handle button interaction (duplicate_ads)
const duplicateAdTrigger: Trigger<typeof duplicateAdWorkflow.definition> = {
  type: TriggerTypes.Shortcut, // Trigger type
  name: "Duplicate Ads Workflow", // Name of the action
  workflow: `#/workflows/${duplicateAdWorkflow.definition.callback_id}`, // Reference the workflow
  inputs: {
    user_id: { value: TriggerContextData.Shortcut.user_id },
    channel_id: { value: TriggerContextData.Shortcut.channel_id },
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
  },
};

export default {
  mentionTrigger,
  fbManagerTrigger,
  fbManagerDevTrigger,
  duplicateAdTrigger,
};
