// services/auth/post-confirmation/handler.js

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new CognitoIdentityProviderClient({});
const ddb = new DynamoDBClient({});

exports.handler = async (event) => {
  const userPoolId = event.userPoolId;
  const username = event.userName;
  const attrs = (event.request && event.request.userAttributes) || {};

  const tenantId = attrs["custom:tenant_id"] || null;
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

  try {
    // 1) Assign default group (fail-soft on UserNotFoundException for console tests)
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
      if (err.name === "UserNotFoundException") {
        console.warn(
          "User not found when adding to group (continuing to entitlements write)",
          JSON.stringify({ username, tenantId, groupName }, null, 2)
        );
      } else {
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
    }

    // 2) Upsert entitlements row (idempotent)
    const tableName = process.env.TENANT_ENTITLEMENTS_TABLE;
    if (!tableName) {
      throw new Error("TENANT_ENTITLEMENTS_TABLE not configured");
    }

    // Must match API tenant-context lookup: claims.sub
    const userSub = attrs.sub || username;

    const role =
      groupName === "cv-admin"
        ? "admin"
        : groupName === "cv-coach"
          ? "coach"
          : groupName === "cv-medical"
            ? "medical"
            : "athlete";

    const tier = "free";

    if (!tenantId) {
      throw new Error("Missing custom:tenant_id; cannot provision entitlements");
    }

    await ddb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          user_sub: { S: userSub },
          tenant_id: { S: tenantId },
          role: { S: role },
          tier: { S: tier },
        },
      })
    );

    console.log(
      "Entitlements upserted",
      JSON.stringify({ userSub, tenantId, role, tier, tableName }, null, 2)
    );

    return event;
  } catch (err) {
    console.error(
      "post_confirmation_handler_error",
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
};