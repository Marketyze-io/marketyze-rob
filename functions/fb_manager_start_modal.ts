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

const INIT_ENDPOINT =
  "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/ad-accounts/init";
const GOOGLE_SHEETS_ROOT_URL = "https://sheets.googleapis.com/v4/spreadsheets/";
const MASTER_SHEET_ID = "1am9nNSWcUYpbvHFA8nk0GAvzedYvyBGTqNNT9YAX0wM";

let fb_name = "";
let fb_id = "";
let externalTokenFb: string | undefined = "";
let externalTokenGs: string | undefined = "";
let _ad_account_id: string;
let _ad_account_name: string;
let _spreadsheet_id: string;

// Function to truncate strings if they are longer than 24 chars
function truncateTitle(title: string) {
  if (title.length > 24) {
    return title.substring(0, 20) + "...";
  }
  return title;
}

// views
function main_menu_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fb-manager-menu",
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name),
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
        "block_id": "section-reinit",
        "text": {
          "type": "mrkdwn",
          "text": "*Reinitialise* the Ad Account",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-reinit",
        },
      },
      {
        "type": "section",
        "block_id": "section-update-audiences",
        "text": {
          "type": "mrkdwn",
          "text": "*Update* Saved Audiences",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-update-saved-audiences",
        },
      },
      {
        "type": "section",
        "block_id": "section-update-pages",
        "text": {
          "type": "mrkdwn",
          "text": "*Update* Facebook Pages",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-update-pages",
        },
      },
      {
        "type": "section",
        "block_id": "section-upload-admedia",
        "text": {
          "type": "mrkdwn",
          "text": "*Upload* Ad Media",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-upload-admedia",
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
            "text": "Start",
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
            "text": "Start",
          },
          "action_id": "button-bulk-fb-adsets",
        },
      },
      {
        "type": "section",
        "block_id": "section-bulk-adcopies",
        "text": {
          "type": "mrkdwn",
          "text": "*Bulk Import* Facebook Adcopies",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-bulk-fb-adcopies",
        },
      },
      {
        "type": "section",
        "block_id": "section-queue-campaigns",
        "text": {
          "type": "mrkdwn",
          "text": "*Queue* Facebook Ad Campaigns",
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Start",
          },
          "action_id": "button-queue-fb-campaigns",
        },
      },
      {
        "type": "divider",
      },
    ],
  };
}

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

function bulk_campaigns_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkCampaign-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Campaigns"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:muscle: I'll get to work on creating those campaigns for ${ad_account_name}! :muscle:`,
          "emoji": true,
        },
      },
    ],
  };
}

function bulk_campaigns_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkCampaign-failure",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Campaigns"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: Something went wrong when starting work on the campaigns for ${ad_account_name}! :warning:\n This is probably a bug, please let my maintainers know.`,
          "emoji": true,
        },
      },
    ],
  };
}

function bulk_adsets_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkAdsets-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Adsets"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:muscle: I'll get to work on creating those adsets for ${ad_account_name}! :muscle:`,
          "emoji": true,
        },
      },
    ],
  };
}

function bulk_adsets_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkAdsets-failure",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Adsets"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: Something went wrong when starting work on the adsets for ${ad_account_name}! :warning:\n This is probably a bug, please let my maintainers know.`,
          "emoji": true,
        },
      },
    ],
  };
}

function bulk_adcopies_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkAdcopies-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Adcopies"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:muscle: I'll get to work on creating those adcopies for ${ad_account_name}! :muscle:`,
          "emoji": true,
        },
      },
    ],
  };
}

function bulk_adcopies_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbBulkAdcopies-failure",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Adcopies"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: Something went wrong when starting work on the adcopies for ${ad_account_name}! :warning:\n This is probably a bug, please let my maintainers know.`,
          "emoji": true,
        },
      },
    ],
  };
}

function update_saved_audiences_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbSavedAudiences-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Saved Audiences"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:tada: The saved audiences for ${ad_account_name} have been updated successfully! :tada:`,
          "emoji": true,
        },
      },
    ],
  };
}

function update_saved_audiences_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbSavedAudiences-failure",
    "close": {
      "type": "plain_text",
      "text": "Close",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Saved Audiences"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: The saved audiences for ${ad_account_name} failed to update! :warning:`,
          "emoji": true,
        },
      },
    ],
  };
}

function update_pages_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbUpdatePages-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Pages"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:tada: The pages for ${ad_account_name} have been updated successfully! :tada:`,
          "emoji": true,
        },
      },
    ],
  };
}

function update_pages_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbUpdatePages-failure",
    "close": {
      "type": "plain_text",
      "text": "Close",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Pages"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: The pages for ${ad_account_name} failed to update! :warning:`,
          "emoji": true,
        },
      },
    ],
  };
}

function upload_admedia_success_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbUploadAdMedia-success",
    "close": {
      "type": "plain_text",
      "text": "Back to Menu",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Ad Media"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:tada: The ad media for ${ad_account_name} is now being uploaded! :tada:`,
          "emoji": true,
        },
      },
    ],
  };
}

function upload_admedia_failed_view(ad_account_name: string) {
  return {
    "type": "modal",
    "callback_id": "fbUploadAdMedia-failure",
    "close": {
      "type": "plain_text",
      "text": "Close",
      "emoji": true,
    },
    "title": {
      "type": "plain_text",
      "text": truncateTitle(ad_account_name + " Ad Media"),
      "emoji": true,
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text":
            `:warning: The ad media for ${ad_account_name} failed to upload! :warning:`,
          "emoji": true,
        },
      },
    ],
  };
}

const onboarding_loading_view = {
  "type": "modal",
  "callback_id": "onboarding-loading",
  "title": {
    "type": "plain_text",
    "text": "Ad Account Onboarding",
  },
  "close": {
    "type": "plain_text",
    "text": "Close",
    "emoji": true,
  },
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text":
          "I am initialising the collab file now. You can close this window and I will notify you when I am done.",
      },
    },
  ],
};

const onboarding_failed_view = {
  "type": "modal",
  "callback_id": "onboarding-failed",
  "title": {
    "type": "plain_text",
    "text": "Ad Account Onboarding",
  },
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text":
          "The collab file failed to initialise! Please contact the app maintainers.",
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
  // Reinitialise Button Handler
  .addBlockActionsHandler(
    "button-reinit",
    async ({ inputs, client, body }) => {
      const init_payload = {
        "spreadsheet_id": _spreadsheet_id,
        "gs_access_token": externalTokenGs,
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "ad_account_name": _ad_account_name,
        "fb_access_token": externalTokenFb,
      };
      const init_response = await fetch(
        INIT_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(init_payload),
        },
      );
      if (init_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${init_response.status})`;
        console.log(error);
        console.log(init_response);
        return {
          response_action: "update",
          view: onboarding_failed_view,
        };
      }

      // Show the loading view
      const response = await client.views.update({
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: onboarding_loading_view,
      });
      // Handle the error if the modal was not opened successfully
      if (response.error) {
        const error =
          `Failed to open a modal in the demo workflow. Contact the app maintainers with the following information - (error: ${response.error})`;
        return { error };
      }

      return {
        completed: false,
      };
    },
  )
  // Update Saved Audiences Button Handler
  .addBlockActionsHandler(
    "button-update-saved-audiences",
    async ({ client, body }) => {
      // Call the lambda function to update saved audiences
      const update_saved_audiences_endpoint =
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/audiences/update";
      const update_saved_audiences_response = await fetch(
        update_saved_audiences_endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fb_access_token: externalTokenFb,
            ad_account_id: _ad_account_id,
            gs_access_token: externalTokenGs,
            spreadsheet_id: _spreadsheet_id,
          }),
        },
      );

      // Handle the error if the lambda function was not called successfully
      if (update_saved_audiences_response.status != 200) {
        const response_text = await update_saved_audiences_response.text();
        const _error =
          `Failed to call lambda function! (status: ${update_saved_audiences_response.status}, body: ${response_text})`;
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: update_saved_audiences_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: update_saved_audiences_success_view(_ad_account_name),
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
  // Update Pages Button Handler
  .addBlockActionsHandler(
    "button-update-pages",
    async ({ client, body }) => {
      // Call the lambda function to update pages
      const update_pages_endpoint =
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/pages/update";
      const update_pages_response = await fetch(update_pages_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fb_access_token: externalTokenFb,
          ad_account_id: _ad_account_id,
          gs_access_token: externalTokenGs,
          spreadsheet_id: _spreadsheet_id,
        }),
      });

      // Handle the error if the lambda function was not called successfully
      if (update_pages_response.status != 200) {
        const response_text = await update_pages_response.text();
        const _error =
          `Failed to call lambda function! (status: ${update_pages_response.status}, body: ${response_text})`;
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: update_pages_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: update_pages_success_view(_ad_account_name),
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
  // Upload Ad Media Button Handler
  .addBlockActionsHandler(
    "button-upload-admedia",
    async ({ inputs, body, client }) => {
      // Prepare the lambda function payload
      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "ad_account_name": _ad_account_name,
        "spreadsheet_id": _spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      // Call the lambda function to upload ad media
      const upload_admedia_response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/admedia/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (upload_admedia_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${upload_admedia_response.status})`;
        console.log(error);
        console.log(upload_admedia_response);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: upload_admedia_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: upload_admedia_success_view(_ad_account_name),
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
  // Bulk Campaigns Button Handler
  .addBlockActionsHandler(
    "button-bulk-fb-campaigns",
    async ({ inputs, body, client }) => {
      // Prepare the lambda function payload
      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "spreadsheet_id": _spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      // Call the lambda function to create bulk campaigns
      const bulk_campaigns_response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/campaigns/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (bulk_campaigns_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${bulk_campaigns_response.status})`;
        console.log(error);
        console.log(bulk_campaigns_response);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: bulk_campaigns_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: bulk_campaigns_success_view(_ad_account_name),
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
  // Bulk Adsets Button Handler
  .addBlockActionsHandler(
    "button-bulk-fb-adsets",
    async ({ inputs, body, client }) => {
      // Prepare the lambda function payload
      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "spreadsheet_id": _spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      // Call the lambda function to create bulk adsets
      const bulk_adsets_response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/adsets/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (bulk_adsets_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${bulk_adsets_response.status})`;
        console.log(error);
        console.log(bulk_adsets_response);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: bulk_adsets_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: bulk_adsets_success_view(_ad_account_name),
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
  // Bulk Adcopies Button Handler
  .addBlockActionsHandler(
    "button-bulk-fb-adcopies",
    async ({ inputs, body, client }) => {
      // Prepare the lambda function payload
      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "ad_account_name": _ad_account_name,
        "spreadsheet_id": _spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      // Call the lambda function to create bulk adcopies
      const bulk_adcopies_response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/adcopies/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (bulk_adcopies_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${bulk_adcopies_response.status})`;
        console.log(error);
        console.log(bulk_adcopies_response);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: bulk_adcopies_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: bulk_adcopies_success_view(_ad_account_name),
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
  // Queue Campaigns Button Handler
  .addBlockActionsHandler(
    "button-queue-fb-campaigns",
    async ({ inputs, body, client }) => {
      // Prepare the lambda function payload
      const payload = {
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "spreadsheet_id": _spreadsheet_id,
        "fb_access_token": externalTokenFb,
        "gs_access_token": externalTokenGs,
      };

      // Call the lambda function to create bulk campaigns
      const bulk_campaigns_response = await fetch(
        "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/campaigns/queue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (bulk_campaigns_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${bulk_campaigns_response.status})`;
        console.log(error);
        console.log(bulk_campaigns_response);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: bulk_campaigns_failed_view(_ad_account_name),
        });
        if (response.error) {
          const error = `Failed to update a modal due to ${response.error}`;
          return { error };
        }
      }

      // Update the modal with a new view
      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: bulk_campaigns_success_view(_ad_account_name),
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
  // Ad Account Submission handler
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
        view: main_menu_view(_ad_account_name),
      };
    },
  )
  // Add to Master Sheet Submission Handler
  .addViewSubmissionHandler(
    "addToMasterSheet-form",
    async ({ inputs, body }) => {
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

      // Validate or Initialise the collab file
      const init_payload = {
        "spreadsheet_id": spreadsheet_id,
        "gs_access_token": externalTokenGs,
        "channel_id": inputs.channel_id,
        "ad_account_id": _ad_account_id,
        "ad_account_name": _ad_account_name,
        "fb_access_token": externalTokenFb,
      };
      const init_response = await fetch(
        INIT_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(init_payload),
        },
      );
      if (init_response.status != 200) {
        const error =
          `Failed to call the API endpoint! (status: ${init_response.status})`;
        console.log(error);
        console.log(init_response);
        return {
          response_action: "update",
          view: onboarding_failed_view,
        };
      }

      // Show the loading view
      return {
        response_action: "update",
        view: onboarding_loading_view,
      };
    },
  );
