// workflows/ads_duplication_workflow.ts
import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import {
  DuplicateAdFunction,
  OpenClientAccountModalFunction,
} from "../functions/duplicate_ads_functions.ts";

// Define the consolidated ads duplication workflow
const duplicateAdWorkflow = DefineWorkflow({
  callback_id: "ads-duplication-workflow", // Unique workflow identifier
  title: "Duplicate Facebook Ad", // Title of the workflow
  description: "Duplicate a Facebook ad and manage the process.", // Description of the workflow
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID
      channel_id: { type: Schema.slack.types.channel_id }, // Channel ID
      interactivity: { type: Schema.slack.types.interactivity }, // Interactivity for modal or action handling
      ad_id: { type: Schema.types.string }, // Ad ID to be duplicated
    },
    required: ["user_id", "channel_id", "ad_id"], // Required inputs
  },
});

// Step 1: Open the client account selection modal
duplicateAdWorkflow.addStep(OpenClientAccountModalFunction, {
  user_id: duplicateAdWorkflow.inputs.user_id, // Pass user_id
  channel_id: duplicateAdWorkflow.inputs.channel_id, // Pass channel_id
  interactivity: duplicateAdWorkflow.inputs.interactivity, // Pass interactivity
});

// Step 2: Duplicate the selected ad
duplicateAdWorkflow.addStep(DuplicateAdFunction, {
  user_id: duplicateAdWorkflow.inputs.user_id, // Pass user_id
  channel_id: duplicateAdWorkflow.inputs.channel_id, // Pass channel_id
  interactivity: duplicateAdWorkflow.inputs.interactivity, // Pass interactivity
  fbAccessTokenId: { credential_source: "END_USER" }, // Use access token from user session
  ad_id: { value: "{{steps.open-client-account-modal.outputs.ad_id}}" }, // Use ad_id from the client selection step
});

export default duplicateAdWorkflow;
