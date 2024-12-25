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

function createModal(title: string, message: string): object {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: title,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ],
  };
}

export function duplicateAdFailedView(adAccountName: string): object {
  return createModal(
    "Ad Duplication Failed",
    `Failed to duplicate the ad for account: ${adAccountName}. Please try again later.`,
  );
}

export function duplicateAdSuccessView(adAccountName: string): object {
  return createModal(
    "Ad Duplication Successful",
    `Successfully duplicated the ad for account: ${adAccountName}.`,
  );
}

// Function to open a modal
async function openModal(client: any, trigger_id: string, view: object) {
  try {
    const response = await client.views.open({
      trigger_id, // Trigger ID provided by Slack
      view, // Modal view definition
    });

    if (!response.ok) {
      throw new Error(`Error opening modal: ${response.error}`);
    }

    console.log("Modal opened successfully.");
  } catch (error) {
    console.error("Error in openModal:", error.message);
  }
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

///////////////////////////////////////////////////////////////////////

// Slack Function Definition
export const DuplicateAdFunction = DefineFunction({
  callback_id: "duplicate-ad-function",
  title: "Duplicate Facebook Ad",
  source_file: "functions/duplicate_ad_functions.ts",
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id },
      channel_id: { type: Schema.slack.types.channel_id },
      interactivity: { type: Schema.slack.types.interactivity },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
    },
    required: ["user_id", "channel_id", "interactivity", "fbAccessTokenId"],
  },
});

// Slack Function Implementation
export default SlackFunction(
  DuplicateAdFunction,
  async ({ inputs, client }) => {
    try {
      const { user_id, channel_id, interactivity, fbAccessTokenId } = inputs;

      // Step 1: Retrieve Facebook access token
      const fbTokenResponse = await client.apps.auth.external.get({
        external_token_id: fbAccessTokenId,
      });

      if (!fbTokenResponse.ok) {
        throw new Error(
          `Failed to retrieve Facebook token: ${fbTokenResponse.error}`,
        );
      }

      const externalTokenFb = fbTokenResponse.external_token;

      // Step 2: Call AWS Lambda to fetch ad accounts
      const fetchAdAccountsEndpoint =
        `${AWS_ROOT_URL}/${AWS_API_STAGE}/ad-accounts/fetch`;
      const fetchAdAccountsPayload = {
        fb_access_token: externalTokenFb,
      };

      const adAccountsResponse = await fetch(fetchAdAccountsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fetchAdAccountsPayload),
      });

      if (!adAccountsResponse.ok) {
        const responseText = await adAccountsResponse.text();
        throw new Error(`Failed to fetch ad accounts: ${responseText}`);
      }

      const adAccounts = await adAccountsResponse.json();

      // Step 3: Prepare dropdown options for modal
      // Debugging: Log the raw API response
      console.log("Ad Accounts API Response:", adAccounts);

      // Validation: Check if the data structure is valid
      if (!adAccounts || !adAccounts.data || !Array.isArray(adAccounts.data)) {
        throw new Error("Invalid or missing ad account data");
      }

      // Mapping: Process the ad accounts into dropdown options
      const options = adAccounts.data.map((
        account: { name: string; id: string },
      ) => ({
        text: { type: "plain_text", text: account.name },
        value: account.id,
      }));

      // Step 4: Open modal for ad account selection
      const modalResponse = await client.views.open({
        interactivity_pointer: interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: "ad_account_selection_modal",
          title: { type: "plain_text", text: "Select Ad Account" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Hi! Select an ad account to duplicate an ad.`,
              },
            },
            {
              type: "input",
              block_id: "ad_account_select_block",
              element: {
                type: "static_select",
                options,
                action_id: "select_ad_account",
              },
              label: { type: "plain_text", text: "Ad Account" },
            },
          ],
          submit: { type: "plain_text", text: "Submit" },
          close: { type: "plain_text", text: "Cancel" },
        },
      });

      if (!modalResponse.ok) {
        throw new Error(`Failed to open modal: ${modalResponse.error}`);
      }

      return { completed: false }; // Wait for modal interaction
    } catch (error) {
      console.error("Error in DuplicateAdFunction:", error.message);
      return { error: error.message };
    }
  },
).addBlockActionsHandler("select_ad_account", async ({ body, client }) => {
  const selectedAdAccountId = body.actions[0].selected_option.value;

  try {
    console.log(`Ad Account Selected: ${selectedAdAccountId}`);

    // Step 5: Perform ad duplication via Lambda
    const duplicateAdEndpoint =
      `${AWS_ROOT_URL}/${AWS_API_STAGE}/ads/duplicate`;
    const duplicateAdPayload = {
      ad_account_id: selectedAdAccountId,
      fb_access_token: externalTokenFb,
    };

    const duplicateAdResponse = await fetch(duplicateAdEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicateAdPayload),
    });

    if (!duplicateAdResponse.ok) {
      const responseText = await duplicateAdResponse.text();
      throw new Error(`Failed to duplicate ad: ${responseText}`);
    }

    // Step 6: Push success modal
    const successModal = {
      type: "modal",
      title: { type: "plain_text", text: "Success" },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `Successfully duplicated the ad for account: ${selectedAdAccountId}.`,
          },
        },
      ],
    };

    await client.views.push({
      view: successModal,
    });

    return { completed: true };
  } catch (error) {
    console.error("Error duplicating ad:", error.message);

    // Step 7: Push failure modal
    const failureModal = {
      type: "modal",
      title: { type: "plain_text", text: "Error" },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Failed to duplicate the ad. Please try again later.`,
          },
        },
      ],
    };

    await client.views.push({
      view: failureModal,
    });

    return { completed: true };
  }
});