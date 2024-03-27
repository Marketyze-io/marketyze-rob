import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

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

export default SlackFunction(
  FbMeFunction,
  async ({ inputs, client }) => {
    console.log("Starting fb_me function...");
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
    const response = await fetch("https://graph.facebook.com/me", {
      headers: new Headers({
        "Authorization": `Bearer ${externalToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    });
    if (response.status != 200) {
      const body = await response.text();
      const error =
        `Failed to call my endpoint! (status: ${response.status}, body: ${body})`;
      return { error };
    }

    // Do something here
    const myApiResponse = await response.json();
    console.log("/me: ", myApiResponse);
    const name = myApiResponse.name;
    const id = myApiResponse.id;

    return {
      outputs: {
        name,
        id,
      },
    };
  },
);
