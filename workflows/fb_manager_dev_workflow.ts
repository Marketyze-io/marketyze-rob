import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerDevModalFunction } from "../functions/fb_manager_dev_modal.ts";

const fbManagerDevWorkflow = DefineWorkflow({
  callback_id: "fb-manager-dev-workflow",
  title: "FB Manager (Dev Mode)",
  description: "Open the menu for testing FB Manager features.",
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

fbManagerDevWorkflow.addStep(FbManagerDevModalFunction, {
  user_id: fbManagerDevWorkflow.inputs.user_id,
  channel_id: fbManagerDevWorkflow.inputs.channel_id,
  interactivity: fbManagerDevWorkflow.inputs.interactivity,
  fbAccessTokenId: {
    credential_source: "END_USER",
  },
  googleSheetsAccessTokenId: {
    credential_source: "END_USER",
  },
});

export default fbManagerDevWorkflow;
