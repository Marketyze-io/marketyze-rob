// In workflows/client_account_selection_workflow.ts
import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { YourWorkflowStepFunction } from "../functions/your_workflow_step_function.ts"; // Import any required function

const clientAccountSelectWorkflow = DefineWorkflow({
  callback_id: "client-account-select-workflow", // Unique ID for the workflow
  title: "Client Account Selection", // Title shown to the user
  description: "Select the client account to perform actions", // Description
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id }, // User ID
      channel_id: { type: Schema.slack.types.channel_id }, // Channel ID
      interactivity: { type: Schema.slack.types.interactivity }, // Interactivity context
    },
    required: ["user_id", "channel_id", "interactivity"], // Required parameters
  },
});

clientAccountSelectWorkflow.addStep(YourWorkflowStepFunction, {
  user_id: clientAccountSelectWorkflow.inputs.user_id,
  channel_id: clientAccountSelectWorkflow.inputs.channel_id,
  interactivity: clientAccountSelectWorkflow.inputs.interactivity,
});

export default clientAccountSelectWorkflow;
