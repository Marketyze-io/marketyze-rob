import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const FbManagerStartModalFunction = DefineFunction({
  callback_id: "fb-manager-start-modal",
  title: "FB Manager Start Modal",
  source_file: "functions/fb_manager_start_modal.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
    },
    required: ["interactivity"],
  },
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  FbManagerStartModalFunction,
  async ({ inputs, client }) => {
    const response = await client.views.open({
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
      view: {
        "type": "modal",
        "callback_id": "fb-manager-menu",
        "title": {
          "type": "plain_text",
          "text": "FB Marketing Bot",
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Hi, here's what I can help you with:",
            },
          },
          {
            "type": "divider",
          },
          {
            "type": "section",
            "block_id": "section-bulk-campaigns",
            "text": {
              "type": "mrkdwn",
              "text": "*Bulk Import* Facebook Ad Campaigns",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-bulk-fb-campaigns",
            },
          },
          {
            "type": "section",
            "block_id": "section-bulk-adsets",
            "text": {
              "type": "mrkdwn",
              "text": "*Bulk Import* Facebook Adsets",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-bulk-fb-adsets",
            },
          },
          {
            "type": "section",
            "block_id": "section-bulk-ads",
            "text": {
              "type": "mrkdwn",
              "text": "*Bulk Import* Facebook Ads",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-bulk-fb-ads",
            },
          },
          {
            "type": "divider",
          },
          {
            "type": "section",
            "block_id": "section-manage-targeting",
            "text": {
              "type": "mrkdwn",
              "text": "*Manage* Facebook Audiences/Targeting",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-bulk-fb-ads",
            },
          },
          {
            "type": "section",
            "block_id": "section-upload-adcreatives",
            "text": {
              "type": "mrkdwn",
              "text": "*Upload* Facebook Ad Creatives",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-upload-fb-ad-creatives",
            },
          },
        ],
      },
    });
    if (response.error) {
      const error =
        `Failed to open a modal in the demo workflow. Contact the app maintainers with the following information - (error: ${response.error})`;
      return { error };
    }
    return {
      // To continue with this interaction, return false for the completion
      completed: false,
    };
  },
).addBlockActionsHandler(
  "button-bulk-fb-campaigns",
  async ({ body, client }) => {
    const response = await client.views.update({
      interactivity_pointer: body.interactivity.interactivity_pointer,
      view_id: body.view.id,
      view: {
        "type": "modal",
        "callback_id": "fbBulkCampaign-form",
        "submit": {
          "type": "plain_text",
          "text": "Submit",
          "emoji": true,
        },
        "close": {
          "type": "plain_text",
          "text": "Cancel",
          "emoji": true,
        },
        "title": {
          "type": "plain_text",
          "text": "Facebook Campaigns",
          "emoji": true,
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text":
                ":wave: Hey David!\n\nHere's the info I need before I can create those campaigns for you.",
              "emoji": true,
            },
          },
          {
            "type": "divider",
          },
          {
            "type": "input",
            "block_id": "spreadsheet_url_input",
            "element": {
              "type": "url_text_input",
              "action_id": "spreadsheet_url_input-action",
            },
            "label": {
              "type": "plain_text",
              "text": "Spreadsheet URL",
              "emoji": true,
            },
          },
          {
            "type": "input",
            "block_id": "ad_acc_id_input",
            "element": {
              "type": "plain_text_input",
              "action_id": "ad_acc_id_input-action",
            },
            "label": {
              "type": "plain_text",
              "text": "Ad Account ID",
              "emoji": true,
            },
          },
          {
            "type": "input",
            "block_id": "token_input",
            "element": {
              "type": "plain_text_input",
              "action_id": "token_input-action",
            },
            "label": {
              "type": "plain_text",
              "text": "Access Token",
              "emoji": true,
            },
          },
        ],
      },
    });
    if (response.error) {
      const error = `Failed to update a modal due to ${response.error}`;
      return { error };
    }
    return {
      completed: false,
    };
  },
);
