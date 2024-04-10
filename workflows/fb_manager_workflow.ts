import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "../functions/fb_manager_start_modal.ts";

const fbManagerWorkflow = DefineWorkflow({
  callback_id: "fb-manager-workflow",
  title: "Open FB Manager",
  description: "Open the main menu for FB Marketing Manager",
  input_parameters: {
    properties: {
      user_id: {
        type: Schema.slack.types.user_id,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
      googleSheetsAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-google-sheets",
      },
    },
    required: ["user_id", "channel_id", "interactivity"],
  },
});

fbManagerWorkflow.addStep(FbManagerStartModalFunction, {
  user_id: fbManagerWorkflow.inputs.user_id,
  channel_id: fbManagerWorkflow.inputs.channel_id,
  interactivity: fbManagerWorkflow.inputs.interactivity,
  fbAccessTokenId: {
    credential_source: "END_USER",
  },
  googleSheetsAccessTokenId: {
    credential_source: "END_USER",
  },
});

export default fbManagerWorkflow;
