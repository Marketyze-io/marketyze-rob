import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Function Definition
export const FbMeFunction = DefineFunction({
  callback_id: "fb-me-function",
  title: "Facebook /me",
  description: "Query the /me endpoint.",
  source_file: "functions/fb_me.ts",
  input_parameters: {
    properties: {
      fbAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "marketyze-login-fb",
      },
    },
    required: ["fbAccessTokenId"],
  },
  output_parameters: {
    properties: {
      name: {
        type: Schema.types.string,
        description: "User's name",
      },
      id: {
        type: Schema.types.string,
        description: "User's id",
      },
    },
    required: ["name", "id"],
  },
});

// Function Implementation
export default SlackFunction(
  FbMeFunction,
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

    // Call the /me endpoint
    const externalToken = tokenResponse.external_token;
    const response = await fetch("https://graph.facebook.com/me", {
      headers: new Headers({
        "Authorization": `Bearer ${externalToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    });

    // Handle the error if the call was not successful
    if (response.status != 200) {
      const body = await response.text();
      const error =
        `Failed to call my endpoint! (status: ${response.status}, body: ${body})`;
      return { error };
    }

    // Format the response
    const myApiResponse = await response.json();
    console.log("/me: ", myApiResponse);
    const name = myApiResponse.name;
    const id = myApiResponse.id;

    // Return the output
    return {
      outputs: {
        name,
        id,
      },
    };
  },
);
