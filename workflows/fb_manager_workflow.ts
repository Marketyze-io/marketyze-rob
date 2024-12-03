import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "../functions/fb_manager_start_modal.ts";

const fbManagerWorkflow = DefineWorkflow({
  callback_id: "fb-manager-workflow", // Unique workflow identifier
  title: "Open FB Manager", // Title shown to the user
  description: "Open the main menu for FB Marketing Manager", // Description of the workflow
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID who triggered the workflow
      channel_id: { type: Schema.slack.types.channel_id }, // Channel ID where the trigger occurred
      interactivity: { type: Schema.slack.types.interactivity }, // Flag to determine if interaction is needed
      fbAccessTokenId: { // OAuth2 token for Facebook
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb", // OAuth provider key
      },
      googleSheetsAccessTokenId: { // OAuth2 token for Google Sheets (optional)
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-google-sheets", // OAuth provider key
      },
    },
    required: ["user_id", "channel_id", "interactivity"], // Required parameters for the workflow
  },
});

fbManagerWorkflow.addStep(FbManagerStartModalFunction, {
  user_id: fbManagerWorkflow.inputs.user_id,
  channel_id: fbManagerWorkflow.inputs.channel_id,
  interactivity: fbManagerWorkflow.inputs.interactivity,
  fbAccessTokenId: { credential_source: "END_USER" }, // Pull the token from the user's session
  googleSheetsAccessTokenId: { credential_source: "END_USER" }, // Optional Google Sheets token
});

export default fbManagerWorkflow;
