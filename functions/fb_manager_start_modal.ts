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
    const tokenResponse = await client.apps.auth.external.get({
      external_token_id: inputs.fbAccessTokenId,
    });
    if (tokenResponse.error) {
      const error =
        `Failed to retrieve the external auth token due to ${tokenResponse.error}`;
      return { error };
    }

    // If the token was retrieved successfully, use it:
    const externalToken = tokenResponse.external_token;
    // Make external API call with externalToken
    const me_response = await fetch("https://graph.facebook.com/me", {
      headers: new Headers({
        "Authorization": `Bearer ${externalToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    });
    if (me_response.status != 200) {
      const body = await me_response.text();
      const error =
        `Failed to call my endpoint! (status: ${me_response.status}, body: ${body})`;
      return { error };
    }

    // Do something here
    const myApiResponse = await me_response.json();
    console.log("/me: ", myApiResponse);
    const fb_name = myApiResponse.name;
    const _fb_id = myApiResponse.id;

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
              "text": `Hi ${fb_name}, here's what I can help you with:`,
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
).addBlockActionsHandler(
  "button-bulk-fb-adsets",
  async ({ body, client }) => {
    const response = await client.views.update({
      interactivity_pointer: body.interactivity.interactivity_pointer,
      view_id: body.view.id,
      view: {
        "type": "modal",
        "callback_id": "fbBulkAdsets-form",
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
          "text": "Facebook Adsets",
          "emoji": true,
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text":
                ":wave: Hey David!\n\nHere's the info I need before I can create those adsets for you.",
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
      completed: true,
    };
  },
);
