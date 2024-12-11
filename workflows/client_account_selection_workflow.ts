// workflows/client_account_selection_workflow.ts
import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { OpenClientAccountModalFunction } from "../functions/duplicate_ads_functions.ts";
import { clientAccountSelectModal } from "../modals/client_account_select_modal.ts";

// Workflow definition
const clientAccountSelectWorkflow = DefineWorkflow({
  callback_id: "client-account-select-workflow", // Unique ID for the workflow
  title: "Select Client Account", // Title for the workflow
  description: "User selects a client account to manage.", // Description
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID
      channel_id: { type: Schema.slack.types.channel_id }, // Channel ID
      interactivity: { type: Schema.slack.types.interactivity }, // For modal interactivity
    },
    required: ["user_id", "channel_id", "interactivity"], // Required parameters
  },
});

// Add step to open the modal
clientAccountSelectWorkflow.addStep(OpenClientAccountModalFunction, {
  user_id: clientAccountSelectWorkflow.inputs.user_id,
  channel_id: clientAccountSelectWorkflow.inputs.channel_id,
  interactivity: clientAccountSelectWorkflow.inputs.interactivity,
});

export default clientAccountSelectWorkflow;
