// workflows/ads_duplication_workflow.ts
import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { DuplicateAdFunction } from "../functions/duplicate_ad_functions.ts";

// Define the consolidated ads duplication workflow
const duplicateAdWorkflow = DefineWorkflow({
  callback_id: "duplicate-ad-workflow", // Unique workflow identifier
  title: "Duplicate Facebook Ad", // Title of the workflow
  description: "Duplicate a Facebook ad and manage the process.", // Description of the workflow
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID
      channel_id: { type: Schema.slack.types.channel_id }, // Channel ID
      interactivity: { type: Schema.slack.types.interactivity }, // Interactivity for modal or action handling
      fbAccessTokenId: { // OAuth2 token for Facebook
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb", // OAuth provider key
      },
    },
    required: ["user_id", "channel_id", "interactivity"], // Required inputs
  },
});

// Step 1: Open the client account selection modal
duplicateAdWorkflow.addStep(DuplicateAdFunction, {
  user_id: duplicateAdWorkflow.inputs.user_id,
  channel_id: duplicateAdWorkflow.inputs.channel_id,
  interactivity: duplicateAdWorkflow.inputs.interactivity,
  fbAccessTokenId: { credential_source: "END_USER" }, // Pull the token from the user's session
});

// Step 2: Duplicate the selected ad
// duplicateAdWorkflow.addStep(DuplicateAdFunction, {
//   user_id: duplicateAdWorkflow.inputs.user_id, // Pass user_id
//   channel_id: duplicateAdWorkflow.inputs.channel_id, // Pass channel_id
//   interactivity: duplicateAdWorkflow.inputs.interactivity, // Pass interactivity
//   fbAccessTokenId: { credential_source: "END_USER" }, // Use access token from user session
//   ad_id: { value: "{{steps.open-client-account-modal.outputs.ad_id}}" }, // Use ad_id from the client selection step
// });

export default duplicateAdWorkflow;
