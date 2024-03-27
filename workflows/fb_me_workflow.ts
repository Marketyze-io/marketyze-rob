import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbMeFunction } from "../functions/fb_me.ts";

const fbMeWorkflow = DefineWorkflow({
  callback_id: "fb-me-workflow",
  title: "Test Facebook Auth",
  description: "Test Facebook Auth using the /me endpoint.",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "A Channel ID",
      },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
    },
    required: ["channel_id"],
  },
});

const getMe = fbMeWorkflow.addStep(
  FbMeFunction,
  {
    fbAccessTokenId: {
      credential_source: "END_USER",
    },
  },
);

fbMeWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: fbMeWorkflow.inputs.channel_id,
    message: `Hello \n\n > ${getMe.outputs.name} :wave:`,
  },
);

export default fbMeWorkflow;
