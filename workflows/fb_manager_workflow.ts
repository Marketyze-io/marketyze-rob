import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "../functions/fb_manager_start_modal.ts";

const fbManagerWorkflow = DefineWorkflow({
  callback_id: "fb-manager-workflow",  // Workflow ID
  title: "Open FB Manager",            // Workflow title
  description: "Open the main menu for FB Marketing Manager",  // Description
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id },  // User ID for the workflow
      channel_id: { type: Schema.slack.types.channel_id },  // Channel ID where workflow is triggered
      interactivity: { type: Schema.slack.types.interactivity },  // Interactivity flag
      fbAccessTokenId: {  // OAuth token for Facebook access
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
      googleSheetsAccessTokenId: {  // OAuth token for Google Sheets (if used)
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-google-sheets",
      },
    },
    required: ["user_id", "channel_id", "interactivity"],  // Required fields
  },
});


fbManagerWorkflow.addStep(FbManagerStartModalFunction, {
  user_id: fbManagerWorkflow.inputs.user_id,  // User ID passed to the function
  channel_id: fbManagerWorkflow.inputs.channel_id,  // Channel ID passed to the function
  interactivity: fbManagerWorkflow.inputs.interactivity,  // Interactivity flag passed to the function
  fbAccessTokenId: {  // Facebook access token, retrieved from OAuth2 credentials
    credential_source: "END_USER",  // Using the end user's credentials
  },
  googleSheetsAccessTokenId: {  // Google Sheets access token, if applicable
    credential_source: "END_USER",  // Using the end user's credentials
  },
});


export default fbManagerWorkflow;
