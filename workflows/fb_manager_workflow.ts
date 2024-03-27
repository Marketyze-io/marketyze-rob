import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "../functions/fb_manager_start_modal.ts";

const fbManagerWorkflow = DefineWorkflow({
  callback_id: "fb-manager-workflow",
  title: "Open FB Manager",
  description: "Open the main menu for FB Marketing Manager",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
});

fbManagerWorkflow.addStep(FbManagerStartModalFunction, {
  interactivity: fbManagerWorkflow.inputs.interactivity,
});

export default fbManagerWorkflow;
