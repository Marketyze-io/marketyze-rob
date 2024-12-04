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

const AWS_ROOT_URL =
  "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com";
const AWS_API_STAGE = "prod";
// const INIT_ENDPOINT =
//   "https://srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com/default/ad-accounts/init";
// const GOOGLE_SHEETS_ROOT_URL = "https://sheets.googleapis.com/v4/spreadsheets/";
// const MASTER_SHEET_ID = "1am9nNSWcUYpbvHFA8nk0GAvzedYvyBGTqNNT9YAX0wM";

let fb_name = "";
let fb_id = "";
let originalAdId: string;
let externalTokenFb: string | undefined = "";
let externalTokenGs: string | undefined = "";
let _ad_account_id: string;
let _ad_account_name: string;
let _spreadsheet_id: string;

// Example in-memory session store (for development, use a DB in production)
// const sessionStore: Record<string, any> = {};
const sessionStore: { [key: string]: { accessToken: string } } = {}; // Temporary in-memory store

function duplicate_ad_failed_view(adAccountName: string) {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Ad Duplication Failed",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `Failed to duplicate the ad for account: ${adAccountName}. Please try again later.`,
        },
      },
    ],
  };
}

function duplicate_ad_success_view(adAccountName: string) {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Ad Duplication Successful",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Successfully duplicated the ad for account: ${adAccountName}.`,
        },
      },
    ],
  };
}

// Exchange code for an access token (using fetch in Deno)
export async function exchangeCodeForAccessToken(code: string) {
  const response = await fetch(
    `https://graph.facebook.com/v14.0/oauth/access_token?client_id=${
      Deno.env.get("FB_APP_ID")
    }&redirect_uri=${Deno.env.get("FB_REDIRECT_URI")}&client_secret=${
      Deno.env.get("FB_APP_SECRET")
    }&code=${code}`,
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(`Error fetching access token: ${data.error.message}`);
  }
  return data.access_token;
}

// Store the access token (adjusting session storage)
export function storeAccessToken(userId: string, accessToken: string) {
  // In Deno, you can use in-memory storage or a database for long-term storage
  // Example: store in memory
  sessionStore[userId] = { accessToken };
}

// Fetch the access token (from sessionStore or database)
export function getAccessToken(userId: string) {
  return sessionStore[userId]?.accessToken; // Return undefined if not found
}

export async function fetchFacebookAds(
  accessToken: string,
  clientAccountId: string,
) {
  const url =
    `https://graph.facebook.com/v14.0/${clientAccountId}/ads?access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.data;
}

// Function to send a modal to a user (this is similar to your existing view structure)
export async function sendSlackModal(userId: string, modalView: object) {
  try {
    const response = await fetch("https://slack.com/api/views.open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SLACK_BOT_TOKEN")}`, // Bot token for authentication
      },
      body: JSON.stringify({
        trigger_id: userId, // You'll need a trigger ID to open the modal
        view: modalView,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Error opening modal: ${data.error}`);
    }

    console.log("Modal sent successfully!");
  } catch (error) {
    console.error("Error sending modal:", error);
  }
}

// Function Definition
export const DuplicateAdFunction = DefineFunction({
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
  DuplicateAdFunction,
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
  .addBlockActionsHandler(
    "button-duplicate-fb-ad",
    async ({ inputs, body, client }) => {
      // const { originalAd, adAccountId, accessToken, _ad_account_name } = inputs; // Ensure 'originalAd' is passed properly

      if (!originalAdId) {
        return { error: "Original ad is missing or incomplete." };
      }

      const payload = {
        channel_id: inputs.channel_id,
        ad_account_id: _ad_account_id,
        fb_access_token: externalTokenFb,
        ad_id: originalAdId, // The ID of the ad to be duplicated
      };

      const duplicate_ad_response = await fetch(
        `${AWS_ROOT_URL}/${AWS_API_STAGE}/duplicate-ad`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (duplicate_ad_response.status !== 200) {
        const error =
          `Failed to duplicate the ad (status: ${duplicate_ad_response.status})`;
        console.log(error);
        const response = await client.views.push({
          interactivity_pointer: body.interactivity.interactivity_pointer,
          view_id: body.view.id,
          view: duplicate_ad_failed_view(_ad_account_name),
        });
        if (response.error) {
          return { error: `Failed to update the modal: ${response.error}` };
        }
      }

      const response = await client.views.push({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view_id: body.view.id,
        view: duplicate_ad_success_view(_ad_account_name),
      });
      if (response.error) {
        return { error: `Failed to update the modal: ${response.error}` };
      }

      return {
        completed: false,
      };
    },
  );
