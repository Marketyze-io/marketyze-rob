import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";

const sayHiWorkflow = DefineWorkflow({
  callback_id: "say-hi-workflow",
  title: "Say Hi!",
  description: "Says Hi.",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "A Channel ID",
      },
      user_id: {
        type: Schema.slack.types.user_id,
        description: "A User ID",
      },
    },
    required: ["channel_id", "user_id"],
  },
});

sayHiWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: sayHiWorkflow.inputs.channel_id,
    message: `Hi @${sayHiWorkflow.inputs.user_id}! \n :wave:`,
  },
);

export default sayHiWorkflow;
