import { Trigger } from "deno-slack-sdk/types.ts";
import fbManagerWorkflow from "../workflows/fb_manager_workflow.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const fbManagerTrigger: Trigger<typeof fbManagerWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Open FB Marketing Manager",
  workflow: `#/workflows/${fbManagerWorkflow.definition.callback_id}`,
  inputs: {
    user_id: {
      value: TriggerContextData.Shortcut.user_id,
    },
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
  },
};

// Handle slash command request
app.command('/duplicate_ads', async ({ command, ack, respond }) => {
  await ack(); // Acknowledge the command

  // Send a message with a button that the user can click to start the login process
  await respond({
    text: 'To duplicate ads on Facebook, please click the button below to log in:',
    attachments: [
      {
        text: 'Click the button to start the process.',
        fallback: 'You are unable to login',
        callback_id: 'login_button_click',
        actions: [
          {
            type: 'button',
            text: 'Login with Facebook',
            action_id: 'login_button_click', // Identifies the action when the button is clicked
            style: 'primary',
            url: 'https://www.facebook.com/v14.0/dialog/oauth?client_id=YOUR_FB_APP_ID&redirect_uri=YOUR_REDIRECT_URI&scope=ads_management',
          },
        ],
      },
    ],
  });
});

app.action('login_button_click', async ({ body, ack, respond }) => {
  await ack();  // Acknowledge the interaction immediately

  // Redirect the user to the Facebook OAuth login page
  const authUrl = `https://www.facebook.com/v14.0/dialog/oauth?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&scope=ads_management`;
  
  // Respond with a message containing the Facebook login URL
  await respond({
    text: `Please log in to your Facebook account: <${authUrl}|Login to Facebook>`,
  });
});

app.action('client_account_select', async ({ body, ack, respond }) => {
  await ack();  // Acknowledge the action

  const selectedClientAccountId = body.actions[0].selected_option.value; // Get selected client account ID
  const userId = body.user.id; // Get the user's Slack ID

  // Store the selected client account ID in your session
  storeClientAccountSelection(userId, selectedClientAccountId);

  // Respond with a message or start the next part of the flow (duplicating ads)
  await respond({
    text: 'You selected the client account. Now, we will begin duplicating ads.',
  });

  // Call the function to start duplicating ads
  await duplicateAdsForClientAccount(selectedClientAccountId, userId);
});



export default fbManagerTrigger;
