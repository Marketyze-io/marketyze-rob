import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Interface representing the options for the static select
interface dropdownOption {
  text: {
    type: string;
    text: string;
    emoji: boolean;
  };
  value: string;
}

// Interface representing the error to be returned if form validation fails
interface formErrors {
  [key: string]: string;
}

let fb_name = "";
let fb_id = "";
let externalToken: string | undefined = "";

// Function Definition
export const FbManagerStartModalFunction = DefineFunction({
  callback_id: "fb-manager-start-modal",
  title: "FB Manager Start Modal",
  source_file: "functions/fb_manager_start_modal.ts",
  input_parameters: {
    properties: {
      user_id: {
        type: Schema.slack.types.user_id,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
    },
    required: ["user_id", "channel_id", "interactivity"],
  },
  output_parameters: { properties: {}, required: [] },
});

// Function Implementation
export default SlackFunction(
  FbManagerStartModalFunction,
  async ({ inputs, client }) => {
    // Retrieve the external token
    const tokenResponse = await client.apps.auth.external.get({
      external_token_id: inputs.fbAccessTokenId,
    });

    // Handle the error if the token was not retrieved successfully
    if (tokenResponse.error) {
      const error =
        `Failed to retrieve the external auth token due to ${tokenResponse.error}`;
      return { error };
    }

    // Call the /me endpoint to retrieve the user's name
    externalToken = tokenResponse.external_token;
    const me_response = await fetch("https://graph.facebook.com/me", {
      headers: new Headers({
        "Authorization": `Bearer ${externalToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    });

    // Handle the error if the /me endpoint was not called successfully
    if (me_response.status != 200) {
      const body = await me_response.text();
      const error =
        `Failed to call my endpoint! (status: ${me_response.status}, body: ${body})`;
      return { error };
    }

    // Format the response
    const myApiResponse = await me_response.json();
    console.log("/me: ", myApiResponse);
    fb_name = myApiResponse.name;
    fb_id = myApiResponse.id;

    // Open the main menu
    const response = await client.views.open({
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
      // Partial modal for testing
      view: {
        "type": "modal",
        "callback_id": "fb-manager-menu",
        "title": {
          "type": "plain_text",
          "text": "FB Marketing",
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
            "block_id": "section-single-campaign",
            "text": {
              "type": "mrkdwn",
              "text": "*Create Single* Facebook Ad Campaign",
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Get Started",
              },
              "action_id": "button-single-fb-campaign",
            },
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
            "type": "divider",
          },
        ],
      },
      /* Full modal
      view: {
        "type": "modal",
        "callback_id": "fb-manager-menu",
        "title": {
          "type": "plain_text",
          "text": "FB Marketing",
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
       */
    });

    // Handle the error if the modal was not opened successfully
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
)
  // Ad Campaigns Handler
  .addBlockActionsHandler(
    "button-bulk-fb-campaigns",
    async ({ body, client }) => {
      // Fetch ad accounts via API
      const me_response = await fetch(
        `https://graph.facebook.com/v19.0/${fb_id}/adaccounts?fields=name`,
        {
          headers: new Headers({
            "Authorization": `Bearer ${externalToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        },
      );

      // Handle the error if the /me endpoint was not called successfully
      if (me_response.status != 200) {
        const body = await me_response.text();
        const error =
          `Failed to call my endpoint! (status: ${me_response.status}, body: ${body})`;
        return { error };
      }

      // Format the response
      const myApiResponse = await me_response.json();
      console.log("Ad Accounts: ", myApiResponse);
      const adAccountData = myApiResponse.data;

      // Create options for the static select
      const options: dropdownOption[] = [];
      adAccountData.forEach((adAccount: { name: string; id: string }) => {
        const option = {
          "text": {
            "type": "plain_text",
            "text": adAccount.name,
            "emoji": true,
          },
          "value": adAccount.id,
        };
        options.push(option);
      });

      // Update the modal with a new view
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
                  `Hi ${fb_name}! :wave:\n\nHere's the info I need before I can create those campaigns for you.`,
                "emoji": true,
              },
            },
            {
              "type": "divider",
            },
            {
              "type": "input",
              "block_id": "ad_account_id_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": options,
                "action_id": "ad_account_id_dropdown-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Ad Account",
                "emoji": true,
              },
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
  )
  // Single Ad Campaign Handler
  .addBlockActionsHandler(
    "button-single-fb-campaign",
    async ({ body, client }) => {
      // Fetch ad accounts via API
      const me_response = await fetch(
        `https://graph.facebook.com/v19.0/${fb_id}/adaccounts?fields=name`,
        {
          headers: new Headers({
            "Authorization": `Bearer ${externalToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        },
      );

      // Handle the error if the /me endpoint was not called successfully
      if (me_response.status != 200) {
        const body = await me_response.text();
        const error =
          `Failed to call my endpoint! (status: ${me_response.status}, body: ${body})`;
        return { error };
      }

      // Format the response
      const myApiResponse = await me_response.json();
      console.log("Ad Accounts: ", myApiResponse);
      const adAccountData = myApiResponse.data;

      // Create options for the static select
      const options: dropdownOption[] = [];
      adAccountData.forEach((adAccount: { name: string; id: string }) => {
        const option = {
          "text": {
            "type": "plain_text",
            "text": adAccount.name,
            "emoji": true,
          },
          "value": adAccount.id,
        };
        options.push(option);
      });

      // Update the modal with a new view
      const response = await client.views.update({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: {
          "type": "modal",
          "callback_id": "fbSingleCampaign-form",
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
                  `Hi ${fb_name}! :wave:\n\nHere's the info I need before I can create that campaign for you.`,
                "emoji": true,
              },
            },
            {
              "type": "divider",
            },
            {
              "type": "input",
              "block_id": "ad_account_id_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": options,
                "action_id": "ad_account_id_dropdown-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Ad Account",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "campaign_name_input",
              "element": {
                "type": "plain_text_input",
                "action_id": "campaign_name_input-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Campaign Name",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "objective_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Awareness",
                      "emoji": true,
                    },
                    "value": "OUTCOME_AWARENESS",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Traffic",
                      "emoji": true,
                    },
                    "value": "OUTCOME_TRAFFIC",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Engagement",
                      "emoji": true,
                    },
                    "value": "OUTCOME_ENGAGEMENT",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Leads",
                      "emoji": true,
                    },
                    "value": "OUTCOME_LEADS",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "App Promotion",
                      "emoji": true,
                    },
                    "value": "OUTCOME_APP_PROMOTION",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Sales",
                      "emoji": true,
                    },
                    "value": "OUTCOME_SALES",
                  },
                ],
                "action_id": "objective_dropdown-select-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Campaign Objective",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "status_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Paused",
                      "emoji": true,
                    },
                    "value": "PAUSED",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Running",
                      "emoji": true,
                    },
                    "value": "RUNNING",
                  },
                ],
                "action_id": "status_dropdown-select-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Campaign Status",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "buying_type_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Auction",
                      "emoji": true,
                    },
                    "value": "AUCTION",
                  },
                ],
                "action_id": "buying_dropdown-select-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Buying Type",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "buying_type_dropdown",
              "element": {
                "type": "static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select an item",
                  "emoji": true,
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Auction",
                      "emoji": true,
                    },
                    "value": "AUCTION",
                  },
                ],
                "action_id": "buying_dropdown-select-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Buying Type",
                "emoji": true,
              },
            },
            {
              "type": "input",
              "block_id": "special_ad_categories_input",
              "element": {
                "type": "multi_static_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select options",
                  "emoji": true,
                },
                "options": [
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Credit",
                      "emoji": true,
                    },
                    "value": "CREDIT",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Employment",
                      "emoji": true,
                    },
                    "value": "EMPLOYMENT",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Housing",
                      "emoji": true,
                    },
                    "value": "HOUSING",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Politics",
                      "emoji": true,
                    },
                    "value": "ISSUES_ELECTIONS_POLITICS",
                  },
                  {
                    "text": {
                      "type": "plain_text",
                      "text": "Online Gambling",
                      "emoji": true,
                    },
                    "value": "ONLINE_GAMBLING_AND_GAMING",
                  },
                ],
                "action_id": "multi_static_select-action",
              },
              "label": {
                "type": "plain_text",
                "text": "Special Ad Categories",
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
  )
  // Adsets Handler
  .addBlockActionsHandler(
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
  )
  // Ad Campaigns Submission Handler
  .addViewSubmissionHandler(
    "fbBulkCampaign-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.text.text;
      const ad_account_id = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.value;
      const spreadsheet_url = body.view.state
        .values["spreadsheet_url_input"]["spreadsheet_url_input-action"].value;
      console.log("Ad Account ID: ", ad_account_id);
      console.log("Spreadsheet URL: ", spreadsheet_url);

      // Form validation
      const errors: formErrors = {};
      if (!ad_account_id) {
        errors["ad_account_id_dropdown"] = "Please select an ad account";
      }
      const isValidUrl = new RegExp(
        "^(https?://)?(www.)?(docs.google.com/spreadsheets/d/)([a-zA-Z0-9-_]+)",
      );
      if (!spreadsheet_url) {
        errors["spreadsheet_url_input"] = "Please enter a spreadsheet URL";
      } else if (!isValidUrl.test(spreadsheet_url)) {
        errors["spreadsheet_url_input"] =
          "Please enter a valid spreadsheet URL";
      }

      if (Object.keys(errors).length > 0) {
        console.log({
          response_action: "errors",
          errors: errors,
        });
        return {
          response_action: "errors",
          errors: errors,
        };
      } else {
        const ephemeralResponse = await client.chat.postEphemeral({
          channel: inputs.channel_id,
          user: inputs.user_id,
          text:
            `I'm working on a request from <@${inputs.user_id}>! :hammer_and_wrench: \n\n
          Here's what I received:\n 
          - Ad Account: ${ad_account_name}\n 
          - Ad Account ID: ${ad_account_id}\n 
          - Spreadsheet URL: ${spreadsheet_url}`,
        });
        if (!ephemeralResponse.ok) {
          console.log(
            "Failed to send an ephemeral message",
            ephemeralResponse.error,
          );
        }
        return;
      }
    },
  )
  // Single Ad Campaign Submission Handler
  .addViewSubmissionHandler(
    "fbSingleCampaign-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.text.text;
      const ad_account_id = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.value;
      const campaign_name = body.view.state
        .values["campaign_name_input"]["campaign_name_input-action"].value;
      const campaign_objective = body.view.state
        .values["objective_dropdown"]["objective_dropdown-select-action"]
        .selected_option.text.text;
      const campaign_status = body.view.state
        .values["status_dropdown"]["status_dropdown-select-action"]
        .selected_option.text.text;
      const buying_type = body.view.state
        .values["buying_type_dropdown"]["buying_dropdown-select-action"]
        .selected_option.text.text;
      const special_ad_categories = body.view.state
        .values["special_ad_categories_input"]["multi_static_select-action"]
        .selected_options.map((option: { text: { text: string } }) =>
          option.text.text
        );
      console.log("Ad Account Name: ", ad_account_name);
      console.log("Ad Account ID: ", ad_account_id);
      console.log("Campaign Name: ", campaign_name);
      console.log("Campaign Objective: ", campaign_objective);
      console.log("Campaign Status: ", campaign_status);
      console.log("Buying Type: ", buying_type);
      console.log("Special Ad Categories: ", special_ad_categories);

      // Form validation
      const errors: formErrors = {};
      if (!ad_account_id) {
        errors["ad_account_id_dropdown"] = "Please select an ad account";
      }
      /*
      if (!spreadsheet_url) {
        errors["spreadsheet_url_input"] = "Please enter a spreadsheet URL";
      } else if (!isValidUrl.test(spreadsheet_url)) {
        errors["spreadsheet_url_input"] =
          "Please enter a valid spreadsheet URL";
      }
      */

      if (Object.keys(errors).length > 0) {
        console.log({
          response_action: "errors",
          errors: errors,
        });
        return {
          response_action: "errors",
          errors: errors,
        };
      } else {
        const ephemeralResponse = await client.chat.postEphemeral({
          channel: inputs.channel_id,
          user: inputs.user_id,
          text:
            `I'm working on a request from <@${inputs.user_id}>! :hammer_and_wrench: \n\n
          Here's what I received:\n 
          - Ad Account: ${ad_account_name}\n 
          - Ad Account ID: ${ad_account_id}\n 
          - Campaign Name: ${campaign_name}\n
          - Campaign Objective: ${campaign_objective}\n
          - Campaign Status: ${campaign_status}\n
          - Buying Type: ${buying_type}\n
          - Special Ad Categories: ${special_ad_categories.join(", ")}`,
        });
        if (!ephemeralResponse.ok) {
          console.log(
            "Failed to send an ephemeral message",
            ephemeralResponse.error,
          );
        }
        return;
      }
    },
  )
  // Ad Campaigns Closed Handler
  .addViewClosedHandler(
    ["fbBulkCampaign-form", "fbBulkAdsets-form"],
    async ({ view, client, body }) => {
      console.log("View was closed: ", view);
      return await client.functions.completeSuccess({
        function_execution_id: body.function_execution_id,
        outputs: {},
      });
    },
  );
