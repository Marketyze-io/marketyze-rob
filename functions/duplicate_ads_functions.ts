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

// Function to handle opening the modal
export const OpenClientAccountModalFunction = DefineFunction({
  callback_id: "open-client-account-modal",
  title: "Open Client Account Modal",
  source_file: "functions/open_client_account_modal.ts",
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id },
      channel_id: { type: Schema.slack.types.channel_id },
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["user_id", "channel_id", "interactivity"],
  },
  output_parameters: {
    properties: {
      ad_id: { type: Schema.types.string }, // The selected ad ID
    },
    required: ["ad_id"],
  },
});

// Define the Slack function
export const DuplicateAdFunction = DefineFunction({
  callback_id: "duplicate-ad-function",
  title: "Duplicate Facebook Ad",
  source_file: "functions/duplicate_ad_function.ts",
  input_parameters: {
    properties: {
      user_id: { type: Schema.slack.types.user_id },
      channel_id: { type: Schema.slack.types.channel_id },
      interactivity: { type: Schema.slack.types.interactivity },
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
      ad_id: { type: Schema.types.string },
    },
    required: ["user_id", "channel_id", "interactivity", "ad_id"],
  },
});

// Function Implementation
// Implement the Slack function
export default SlackFunction(
  DuplicateAdFunction,
  async ({ inputs, client }) => {
    try {
      // Step 1: Retrieve Facebook access token
      const fbTokenResponse = await client.apps.auth.external.get({
        external_token_id: inputs.fbAccessTokenId,
      });

      if (fbTokenResponse.error) {
        throw new Error(
          `Failed to retrieve Facebook token: ${fbTokenResponse.error}`,
        );
      }

      const externalTokenFb = fbTokenResponse.external_token;

      // Step 2: Fetch user info from Facebook
      const userInfoResponse = await fetch("https://graph.facebook.com/me", {
        headers: { Authorization: `Bearer ${externalTokenFb}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error(
          `Failed to fetch user info: ${await userInfoResponse.text()}`,
        );
      }

      const userInfo = await userInfoResponse.json();
      const fb_name = userInfo.name;

      // Step 3: Fetch ad accounts
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v19.0/${userInfo.id}/adaccounts?fields=name`,
        { headers: { Authorization: `Bearer ${externalTokenFb}` } },
      );

      if (!adAccountsResponse.ok) {
        throw new Error(
          `Failed to fetch ad accounts: ${await adAccountsResponse.text()}`,
        );
      }

      const adAccounts = await adAccountsResponse.json();

      // Prepare dropdown options for ad account selection
      const options = adAccounts.data.map((
        account: { name: string; id: string },
      ) => ({
        text: { type: "plain_text", text: account.name },
        value: account.id,
      }));

      // Step 4: Open the ad account selection modal
      const modalResponse = await client.views.open({
        interactivity_pointer: inputs.interactivity.interactivity_pointer,
        view: {
          type: "modal",
          callback_id: "ad_account_selection_modal",
          title: { type: "plain_text", text: "Select Ad Account" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Hi ${fb_name}, select an ad account:`,
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

      if (modalResponse.error) {
        throw new Error(`Failed to open modal: ${modalResponse.error}`);
      }

      return { completed: false }; // Continue interaction after modal
    } catch (error) {
      console.error("Error in DuplicateAdFunction:", error.message);
      return { error: error.message };
    }
  },
)
  .addBlockActionsHandler("select_ad_account", async ({ body, client }) => {
    const selectedAdAccountId = body.actions[0].selected_option.value;
    console.log(`Ad Account Selected: ${selectedAdAccountId}`);

    const triggerResponse = await client.triggers.invoke({
      trigger_id: body.trigger_id, // Trigger ID from the user interaction
      workflow: "#/triggers/ads-duplication-trigger",
      inputs: {
        user_id: body.user.id,
        ad_id: selectedAdAccountId,
      },
    });

    if (triggerResponse.error) {
      console.error("Error invoking workflow trigger:", triggerResponse.error);
      throw new Error("Failed to invoke workflow.");
    }

    return { completed: true };
  })
  .addBlockActionsHandler("duplicate_ad_button", async ({ inputs, client }) => {
    // Step 6: Duplicate ad via AWS Lambda or API
    try {
      const payload = {
        channel_id: inputs.channel_id,
        ad_account_id: inputs.ad_id, // Passed from previous step
        fb_access_token: inputs.fbAccessTokenId,
      };

      const response = await fetch(
        `${AWS_ROOT_URL}/${AWS_API_STAGE}/duplicate-ad`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.status !== 200) {
        throw new Error(`Failed to duplicate ad: ${response.statusText}`);
      }

      // Show success modal
      const successModal = duplicateAdSuccessView("Ad Duplication Successful!");
      await client.views.push({
        view: successModal,
      });
    } catch (error) {
      console.error("Error duplicating ad:", error);

      // Show failure modal
      const failureModal = duplicateAdFailedView("Ad Duplication Failed!");
      await client.views.push({
        view: failureModal,
      });
    }
  });
