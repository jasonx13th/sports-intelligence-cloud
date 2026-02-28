// services/auth/post-confirmation/handler.js

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({});

/**
 * Cognito PostConfirmation trigger.
 * - Reads custom:tenant_id
 * - Adds user to a default group (cv-athlete) for now
 * - Logs structured information to CloudWatch
 */
exports.handler = async (event) => {
  const userPoolId = event.userPoolId;
  const username = event.userName;
  const attrs = (event.request && event.request.userAttributes) || {};

  const tenantId = attrs["custom:tenant_id"];

  // Default role for now (since custom:requested_role is not in the pool schema yet)
  const groupName = "cv-athlete";

  console.log(
    "PostConfirmation event",
    JSON.stringify(
      {
        triggerSource: event.triggerSource,
        userPoolId,
        username,
        tenantId,
        groupName,
      },
      null,
      2
    )
  );

  if (!tenantId) {
    console.warn(
      "User confirmed without tenant_id attribute",
      JSON.stringify({ userPoolId, username }, null, 2)
    );
  }

  try {
    await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      })
    );

    console.log(
      "User added to group",
      JSON.stringify({ username, tenantId, groupName }, null, 2)
    );
  } catch (err) {
    console.error(
      "Failed to add user to group",
      JSON.stringify(
        {
          username,
          tenantId,
          groupName,
          errorMessage: err.message,
          name: err.name,
        },
        null,
        2
      )
    );
    throw err;
  }

  return event;
};