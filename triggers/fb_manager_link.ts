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

export default fbManagerTrigger;
