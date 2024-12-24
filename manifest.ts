import { DefineOAuth2Provider, Manifest, Schema } from "deno-slack-sdk/mod.ts";
import { FbManagerStartModalFunction } from "./functions/fb_manager_start_modal.ts";
import { FbManagerDevModalFunction } from "./functions/fb_manager_dev_modal.ts";
import fbManagerWorkflow from "./workflows/fb_manager_workflow.ts";
import fbManagerDevWorkflow from "./workflows/fb_manager_dev_workflow.ts";
import fbMeWorkflow from "./workflows/fb_me_workflow.ts";
import sayHiWorkflow from "./workflows/say_hi_workflow.ts";
import duplicateAdWorkflow from "./workflows/duplicate_ad_workflow.ts";
import { FbMeFunction } from "./functions/fb_me.ts";

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

const GoogleSheetsOAuthProvider = DefineOAuth2Provider({
  provider_key: "marketyze-login-google-sheets",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    provider_name: "Google Sheets",
    authorization_url: "https://accounts.google.com/o/oauth2/auth",
    token_url: "https://oauth2.googleapis.com/token",
    client_id:
      "434069935105-us197bf22st63df5l70pn09mikg3e0k0.apps.googleusercontent.com",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    identity_config: {
      url: "https://www.googleapis.com/oauth2/v1/userinfo",
      account_identifier: "$.email",
    },
  },
});

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "Slack Rob",
  description:
    "This is Rob. Rob is a robot. This version of Rob lives in the Slack Platform",
  icon: "assets/rob_icon.png",
  functions: [
    FbManagerStartModalFunction,
    FbManagerDevModalFunction,
    FbMeFunction,
  ],
  workflows: [
    fbManagerWorkflow,
    fbManagerDevWorkflow,
    fbMeWorkflow,
    sayHiWorkflow,
    duplicateAdWorkflow,
  ],
  outgoingDomains: [
    "graph.facebook.com",
    "facebook.com",
    "srdb19dj4h.execute-api.ap-southeast-1.amazonaws.com",
    "sheets.googleapis.com",
    "www.googleapis.com",
    "accounts.google.com",
  ],
  datastores: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "triggers:write",
    "app_mentions:read",
  ],
  externalAuthProviders: [
    FbOAuthProvider,
    GoogleSheetsOAuthProvider,
  ],
});
