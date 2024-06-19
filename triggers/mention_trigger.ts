import { Trigger } from "deno-slack-sdk/types.ts";
import sayHiWorkflow from "../workflows/say_hi_workflow.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";

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

export default mentionTrigger;
