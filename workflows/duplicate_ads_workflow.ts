import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
//import { DuplicateAdFunction } from "../functions/fb_manager_start_modal.ts"; // Import your new function for duplication

// Define the new ads duplication workflow
const duplicateAdWorkflow = DefineWorkflow({
  callback_id: "duplicate-ad-workflow", // Unique identifier for the workflow
  title: "Duplicate Facebook Ad", // Title of the workflow
  description: "Duplicate a Facebook ad and manage the process", // Description of the workflow
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID to link workflow to
      channel_id: { type: Schema.slack.types.channel_id }, // Channel where interaction occurred
      interactivity: { type: Schema.slack.types.interactivity }, // Flag to determine interaction needs
      fbAccessTokenId: { // OAuth2 token for Facebook
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb", // OAuth provider key for Facebook
      },
      ad_id: { // Facebook Ad ID to be duplicated
        type: Schema.types.string,
      },
    },
    required: ["user_id", "channel_id", "interactivity", "ad_id"], // Required inputs
  },
});

// Add the step to duplicate the ad
duplicateAdWorkflow.addStep(DuplicateAdFunction, {
  user_id: duplicateAdWorkflow.inputs.user_id,
  channel_id: duplicateAdWorkflow.inputs.channel_id,
  interactivity: duplicateAdWorkflow.inputs.interactivity,
  fbAccessTokenId: { credential_source: "END_USER" }, // Pull the access token from the user session
  ad_id: duplicateAdWorkflow.inputs.ad_id, // Ad ID passed from the user
});

export default duplicateAdWorkflow;
