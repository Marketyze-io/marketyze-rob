import { Trigger } from "deno-slack-sdk/types.ts";
import sayHiWorkflow from "../workflows/say_hi_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const mentionTrigger: Trigger<typeof sayHiWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Say Hi!",
  workflow: `#/workflows/${sayHiWorkflow.definition.callback_id}`,
  inputs: {
    user_id: {
      value: TriggerContextData.Shortcut.user_id,
    },
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default mentionTrigger;
