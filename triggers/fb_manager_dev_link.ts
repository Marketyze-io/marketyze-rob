import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerDevWorkflow from "../workflows/fb_manager_dev_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const fbManagerDevTrigger: Trigger<typeof fbManagerDevWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Open FB Marketing Manager",
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

export default fbManagerDevTrigger;
