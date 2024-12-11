// modals/client_account_select_modal.ts
export const clientAccountSelectModal = {
  type: "modal",
  callback_id: "client_account_select_modal",
  title: {
    type: "plain_text",
    text: "Select Client Account",
  },
  blocks: [
    {
      type: "input",
      block_id: "client_account_input_block",
      label: {
        type: "plain_text",
        text: "Enter Client Account ID",
      },
      element: {
        type: "plain_text_input",
        action_id: "client_account_input_action",
        placeholder: {
          type: "plain_text",
          text: "Client Account ID",
        },
      },
    },
  ],
  submit: {
    type: "plain_text",
    text: "Submit",
  },
  close: {
    type: "plain_text",
    text: "Cancel",
  },
};

// Example Slack Modal with a button to trigger the Duplicate Ad workflow
export const duplicateAdModal = {
  type: "modal",
  callback_id: "duplicate_ad_modal",
  title: {
    type: "plain_text",
    text: "Duplicate Facebook Ad",
  },
  blocks: [
    {
      type: "input",
      block_id: "ad_input_block",
      label: {
        type: "plain_text",
        text: "Enter Ad ID",
      },
      element: {
        type: "plain_text_input",
        action_id: "ad_input_action",
        placeholder: {
          type: "plain_text",
          text: "Ad ID",
        },
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Duplicate Ad",
          },
          action_id: "duplicate_ad_button",
        },
      ],
    },
  ],
};
