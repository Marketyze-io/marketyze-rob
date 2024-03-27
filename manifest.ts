import { DefineOAuth2Provider, Manifest, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "./functions/fb_manager_start_modal.ts";
import fbManagerWorkflow from "./workflows/fb_manager_workflow.ts";
import fbMeWorkflow from "./workflows/fb_me_workflow.ts";
import { FbMeFunction } from "./functions/fb_me.ts";
import fbCampaignCreateSingleWorkflow from "./workflows/fb_campaign_create_single_workflow.ts";
import { FbGetAdAccountsFunction } from "./functions/fb_get_ad_accounts.ts";

const FbOAuthProvider = DefineOAuth2Provider({
  provider_key: "marketyze-login-fb",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    provider_name: "Facebook",
    authorization_url: "https://www.facebook.com/v19.0/dialog/oauth",
    token_url: "https://graph.facebook.com/oauth/access_token",
    client_id: "264652917823131",
    scope: [],
    authorization_url_extras: {
      config_id: "1436380706979744",
    },
    identity_config: {
      url: "https://graph.facebook.com/me",
      account_identifier: "$.name",
    },
  },
});

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "test-app",
  description: "A template for building Slack apps with Deno",
  icon: "assets/default_new_app_icon.png",
  functions: [
    FbManagerStartModalFunction,
    FbMeFunction,
    FbGetAdAccountsFunction,
  ],
  workflows: [fbManagerWorkflow, fbMeWorkflow, fbCampaignCreateSingleWorkflow],
  outgoingDomains: ["graph.facebook.com", "facebook.com"],
  datastores: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "triggers:write",
  ],
  externalAuthProviders: [FbOAuthProvider],
});
