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

const GOOGLE_SHEETS_ROOT_URL = "https://sheets.googleapis.com/v4/spreadsheets/";
const MASTER_SHEET_ID = "1am9nNSWcUYpbvHFA8nk0GAvzedYvyBGTqNNT9YAX0wM";

let fb_name = "";
let fb_id = "";
let externalTokenFb: string | undefined = "";
let externalTokenGs: string | undefined = "";
let _ad_account_id: string;
let _ad_account_name: string;
let _spreadsheet_id: string;

// static views
const main_menu_view = {
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
        "text": "Here's what I can help you with:",
      },
    },
    {
      "type": "divider",
    },
    {
      "type": "section",
      "block_id": "section-update-pull",
      "text": {
        "type": "mrkdwn",
        "text": "*Update* Ad Campaign data",
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Get Started",
        },
        "action_id": "button-update-pull-fb-campaign",
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
    {
      "type": "section",
      "block_id": "section-single-adsets",
      "text": {
        "type": "mrkdwn",
        "text": "*Create Single* Facebook Adset",
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Not working yet!",
        },
        "action_id": "button-single-fb-adsets",
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
  ],
};

const add_to_master_sheet_view = {
  "type": "modal",
  "callback_id": "addToMasterSheet-form",
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
    "text": "Facebook Marketing",
    "emoji": true,
  },
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "plain_text",
        "text":
          ":warning: Looks like that Ad Account isn't in my database. :warning:\n\n:hammer_and_wrench: Let's fix that! :hammer_and_wrench:",
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
  ],
};

const bulk_campaigns_view = {
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
};

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
      googleSheetsAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-google-sheets",
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
    // Retrieve the Facebook external token
    const tokenResponse = await client.apps.auth.external.get({
      external_token_id: inputs.fbAccessTokenId,
    });

    // Handle the error if the token was not retrieved successfully
    if (tokenResponse.error) {
      const error =
        `Failed to retrieve the external auth token due to ${tokenResponse.error}`;
      return { error };
    }
    externalTokenFb = tokenResponse.external_token;

    // Retrieve the Google Sheets external token
    const gsTokenResponse = await client.apps.auth.external.get({
      external_token_id: inputs.googleSheetsAccessTokenId,
    });

    // Handle the error if the token was not retrieved successfully
    if (gsTokenResponse.error) {
      const error =
        `Failed to retrieve the external auth token due to ${gsTokenResponse.error}`;
      return { error };
    }
    externalTokenGs = gsTokenResponse.external_token;

    // Call the /me endpoint to retrieve the user's name
    const me_response = await fetch("https://graph.facebook.com/me", {
      headers: new Headers({
        "Authorization": `Bearer ${externalTokenFb}`,
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

    // Fetch ad accounts via API
    const ad_accounts_response = await fetch(
      `https://graph.facebook.com/v19.0/${fb_id}/adaccounts?fields=name`,
      {
        headers: new Headers({
          "Authorization": `Bearer ${externalTokenFb}`,
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      },
    );

    // Handle the error if the /me endpoint was not called successfully
    if (ad_accounts_response.status != 200) {
      const body = await ad_accounts_response.text();
      const error =
        `Failed to call my endpoint! (status: ${ad_accounts_response.status}, body: ${body})`;
      return { error };
    }

    // Format the response
    const apiResponse = await ad_accounts_response.json();
    console.log("Ad Accounts: ", apiResponse);
    const adAccountData = apiResponse.data;

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

    // Open the Ad Account Form
    const response = await client.views.open({
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
      view: {
        "type": "modal",
        "callback_id": "fb-ad-account-form",
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
          "text": "FB Marketing",
        },
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text":
                `Hi ${fb_name}, which ad account are we working on today?`,
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
        ],
      },
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
  // Ad account dropdown submission handler
  .addViewSubmissionHandler(
    "fb-ad-account-form",
    async ({ body }) => {
      // Extract inputs
      _ad_account_name = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.text.text;
      _ad_account_id = body.view.state
        .values["ad_account_id_dropdown"]["ad_account_id_dropdown-action"]
        .selected_option.value;

      // Input validation
      if (!_ad_account_id) {
        const errors: formErrors = {};
        errors["ad_account_id_dropdown"] = "Please select an ad account";
        return {
          response_action: "errors",
          errors: errors,
        };
      }

      // Retrieve the row count from the master sheet
      const gs_count_endpoint = GOOGLE_SHEETS_ROOT_URL + MASTER_SHEET_ID +
        "/values/'spreadsheet-master-list'!B1?access_token=" + externalTokenGs;
      const gs_count_response = await fetch(gs_count_endpoint);

      // Handle the error if the gs_count endpoint was not called successfully
      if (gs_count_response.status != 200) {
        const body = await gs_count_response.text();
        const error =
          `Failed to call gs endpoint! (status: ${gs_count_response.status}, body: ${body})`;
        return { error };
      }

      // Format the response
      const gs_count_json = await gs_count_response.json();
      console.log("gs_count_json: ", gs_count_json);
      const gs_row_count = gs_count_json.values[0][0] as number;
      console.log("gs_row_count: ", gs_row_count);

      //Check if spreadsheet is empty
      if (gs_row_count == 0) {
        // Open modal to add ad account to master sheet
        return {
          response_action: "update",
          view: add_to_master_sheet_view,
        };
      }

      // Retrieve the campaign id table from the master sheet
      const gs_master_endpoint = GOOGLE_SHEETS_ROOT_URL + MASTER_SHEET_ID +
        "/values/'spreadsheet-master-list'!A3:C" + String(3 + gs_row_count) +
        "?majorDimension=COLUMNS" + "&access_token=" + externalTokenGs;
      const gs_master_response = await fetch(gs_master_endpoint);

      // Handle the error if the gs_count endpoint was not called successfully
      if (gs_master_response.status != 200) {
        const body = await gs_master_response.text();
        const error =
          `Failed to call gs endpoint! (status: ${gs_master_response.status}, body: ${body})`;
        return { error };
      }

      // Find the spreadsheet id
      const gs_master_json = await gs_master_response.json();
      console.log("gs_master_json: ", gs_master_json);
      const index: number = gs_master_json.values[1].indexOf(
        _ad_account_id,
      );
      console.log("index: ", index);
      console.log("typeof index: ", typeof index);
      // Check if ad account was missing from the master sheet
      if (index < 0) {
        // Open modal to add ad account to master sheet
        return {
          response_action: "update",
          view: add_to_master_sheet_view,
        };
      }
      _spreadsheet_id = gs_master_json.values[2][index];

      // TEST: Check the three main global values
      console.log("Ad Account Name: ", _ad_account_name);
      console.log("Ad Account ID: ", _ad_account_id);
      console.log("Spreadsheet ID: ", _spreadsheet_id);

      // Open the main menu
      return {
        response_action: "update",
        view: main_menu_view,
      };
    },
  )
  // Ad Campaigns Update (Pull only) Handler
  .addBlockActionsHandler(
    "button-update-pull-fb-campaign",
    async ({ body, client }) => {
      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: {
          "type": "modal",
          "callback_id": "fbCampaign-updatePull-form",
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
                  `Hi ${fb_name}! :wave:\n\nPick a spreadsheet to update.`,
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
      // Update the modal with a new view
      const response = await client.views.push({
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
              "block_id": "special_ad_categories_input",
              "optional": true,
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
  // Ad Campaigns Handler
  .addBlockActionsHandler(
    "button-bulk-fb-campaigns",
    async ({ body, client }) => {
      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: bulk_campaigns_view,
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
  // Single Adset Handler (TODO)
  .addBlockActionsHandler(
    "button-single-fb-adsets",
    async ({ body, client }) => {
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: {
          "type": "modal",
          "callback_id": "fbSingleAdsets-form",
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
  // Adsets Handler
  .addBlockActionsHandler(
    "button-bulk-fb-adsets",
    async ({ body, client }) => {
      // Update the modal with a new view
      const response = await client.views.push({
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
                  `Hi ${fb_name}! :wave:\n\nHere's the info I need before I can create those adsets for you.`,
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
  // Add to Master Sheet Submission Handler
  .addViewSubmissionHandler(
    "addToMasterSheet-form",
    async ({ body }) => {
      const spreadsheet_url = body.view.state
        .values["spreadsheet_url_input"]["spreadsheet_url_input-action"]
        .value;

      // Form validation
      const errors: formErrors = {};
      const isValidUrl = new RegExp(
        "^(https?://)?(www.)?(docs.google.com/spreadsheets/d/)([a-zA-Z0-9-_]+)",
      );
      if (!isValidUrl.test(spreadsheet_url)) {
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
      }

      const spreadsheet_id = spreadsheet_url.split("/")[5];
      console.log("Spreadsheet ID: ", spreadsheet_id);

      // Add spreadsheet id to master sheet
      const gs_append_endpoint = GOOGLE_SHEETS_ROOT_URL + MASTER_SHEET_ID +
        "/values/'spreadsheet-master-list'!A3:append?access_token=" +
        externalTokenGs;
      console.log("gs_append_endpoint: ", gs_append_endpoint);
      const gs_append_body = {
        "majorDimension": "ROWS",
        "values": [[
          _ad_account_name,
          _ad_account_id,
          spreadsheet_id,
        ]],
      };
      const gs_append_response = await fetch(
        gs_append_endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gs_append_body),
        },
      );
      console.log("gs_append_response: ", gs_append_response);

      // Handle the error if the gs_append endpoint was not called successfully
      if (gs_append_response.status != 200) {
        const body = await gs_append_response.text();
        const error =
          `Failed to call gs endpoint! (status: ${gs_append_response.status}, body: ${body})`;
        return { error };
      }

      _spreadsheet_id = spreadsheet_id;

      // TEST: Check the three main global values
      console.log("Ad Account Name: ", _ad_account_name);
      console.log("Ad Account ID: ", _ad_account_id);
      console.log("Spreadsheet ID: ", _spreadsheet_id);

      // Open the main menu
      return {
        response_action: "update",
        view: main_menu_view,
      };
    },
  )
  // Ad Campaigns Update (Pull only) Submission Handler
  .addViewSubmissionHandler(
    "fbCampaign-updatePull-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = _ad_account_name;
      const ad_account_id = _ad_account_id;
      const spreadsheet_url = body.view.state
        .values["spreadsheet_url_input"]["spreadsheet_url_input-action"].value;

      // Form validation
      const errors: formErrors = {};
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
      }

      const spreadsheet_id = spreadsheet_url.split("/")[5];
      console.log("Spreadsheet ID: ", spreadsheet_id);

      const chatResponse = await client.chat.postMessage({
        channel: inputs.channel_id,
        text:
          `I'm working on a request from <@${inputs.user_id}>! :hammer_and_wrench: \n\n
        I'm going to update these accounts:\n 
        - Ad Account: ${ad_account_name}\n 
        - Ad Account ID: ${ad_account_id}\n 
        - Spreadsheet URL: ${spreadsheet_url}`,
      });
      if (!chatResponse.ok) {
        console.log(
          "Failed to send a chat message",
          chatResponse.error,
        );
      }

      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": ad_account_id,
        "spreadsheet_id": spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      const response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/campaigns/update/pull",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${response.status})`;
        console.log(error);
        console.log(response);
        return { error };
      }

      return;
    },
  )
  // Single Ad Campaign Submission Handler
  .addViewSubmissionHandler(
    "fbSingleCampaign-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = _ad_account_name;
      const ad_account_id = _ad_account_id;
      const campaign_name = body.view.state
        .values["campaign_name_input"]["campaign_name_input-action"].value;
      const campaign_objective = body.view.state
        .values["objective_dropdown"]["objective_dropdown-select-action"]
        .selected_option.value;
      const campaign_status = body.view.state
        .values["status_dropdown"]["status_dropdown-select-action"]
        .selected_option.value;
      const buying_type = body.view.state
        .values["buying_type_dropdown"]["buying_dropdown-select-action"]
        .selected_option.value;
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
        const payload = {
          "campaign_name": campaign_name,
          "campaign_objective": campaign_objective,
          "campaign_status": campaign_status,
          "campaign_buying_type": buying_type,
          "special_ad_categories": special_ad_categories,
          "ad_account_id": ad_account_id,
          "access_token": externalTokenFb,
        };
        const response = await fetch(
          "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/campaigns/single",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        if (response.status != 200) {
          const error =
            `Failed to call the API endpoint! (status: ${response.status})`;
          console.log(error);
          console.log(response);
          return { error };
        }
        return;
      }
    },
  )
  // Ad Campaigns Submission Handler
  .addViewSubmissionHandler(
    "fbBulkCampaign-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = _ad_account_name;
      const ad_account_id = _ad_account_id;
      const spreadsheet_url = body.view.state
        .values["spreadsheet_url_input"]["spreadsheet_url_input-action"].value;

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
      }

      const spreadsheet_id = spreadsheet_url.split("/")[5];
      console.log("Spreadsheet ID: ", spreadsheet_id);

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

      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": ad_account_id,
        "spreadsheet_id": spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      const response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/campaigns/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${response.status})`;
        console.log(error);
        console.log(response);
        return { error };
      }

      return;
    },
  )
  // Single Adset Submission Handler (TODO)
  // Adsets Submission Handler
  .addViewSubmissionHandler(
    "fbBulkAdsets-form",
    async ({ inputs, body, client }) => {
      const ad_account_name = _ad_account_name;
      const ad_account_id = _ad_account_id;
      const spreadsheet_url = body.view.state
        .values["spreadsheet_url_input"]["spreadsheet_url_input-action"].value;

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
      }

      const spreadsheet_id = spreadsheet_url.split("/")[5];
      console.log("Spreadsheet ID: ", spreadsheet_id);

      const ephemeralResponse = await client.chat.postEphemeral({
        channel: inputs.channel_id,
        user: inputs.user_id,
        text:
          `I'm working on an adset request from <@${inputs.user_id}>! :hammer_and_wrench: \n\n
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

      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": ad_account_id,
        "spreadsheet_id": spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      const response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/adsets/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${response.status})`;
        console.log(error);
        console.log(response);
        return { error };
      }

      return;
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
