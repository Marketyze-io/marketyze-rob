import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const fbManagerTrigger: Trigger<typeof fbManagerWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Open FB Marketing Manager",
  workflow: `#/workflows/${fbManagerWorkflow.definition.callback_id}`,
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

export default fbManagerTrigger;
