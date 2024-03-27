import { Trigger } from "deno-slack-sdk/types.ts";
import workflow from "../workflows/fb_manager_workflow.ts";

const fbManagerTrigger: Trigger<typeof workflow.definition> = {
  type: "shortcut",
  name: "Open FB Marketing Manager",
  workflow: `#/workflows/${workflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
  },
};

export default fbManagerTrigger;
