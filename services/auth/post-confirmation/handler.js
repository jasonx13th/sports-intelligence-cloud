// services/auth/post-confirmation/handler.js

const { createHash } = require("node:crypto");

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new CognitoIdentityProviderClient({});
const ddb = new DynamoDBClient({});

function createTenantId(userSub) {
  if (!userSub) {
    throw new Error("Missing user sub/username; cannot provision entitlements");
  }

  return `tenant_${createHash("sha256").update(String(userSub)).digest("hex").slice(0, 12)}`;
}

function resolveTenantId(attrs, userSub) {
  const tenantId = attrs["custom:tenant_id"] || "";
  return tenantId.trim() || createTenantId(userSub);
}

function buildEntitlementsPut({ tableName, userSub, tenantId, role, tier }) {
  return new PutItemCommand({
    TableName: tableName,
    Item: {
      user_sub: { S: userSub },
      tenant_id: { S: tenantId },
      role: { S: role },
      tier: { S: tier },
    },
    ConditionExpression: "attribute_not_exists(user_sub)",
  });
}

function createHandler({
  cognitoClient = client,
  dynamoClient = ddb,
} = {}) {
  return async (event) => {
    const userPoolId = event.userPoolId;
    const username = event.userName;
    const attrs = (event.request && event.request.userAttributes) || {};

    // Must match API tenant-context lookup: claims.sub. In current Cognito logs/user flows,
    // event.userName is also the sub, but prefer the explicit attribute when present.
    const userSub = attrs.sub || username;
    const tenantId = resolveTenantId(attrs, userSub);
    const groupName = "cv-coach";

    console.log(
      "PostConfirmation event",
      JSON.stringify(
        {
          triggerSource: event.triggerSource,
          userPoolId,
          username,
          userSub,
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
        await cognitoClient.send(
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

      // 2) Provision entitlements row (idempotent)
      const tableName = process.env.TENANT_ENTITLEMENTS_TABLE;
      if (!tableName) {
        throw new Error("TENANT_ENTITLEMENTS_TABLE not configured");
      }

      const role =
        groupName === "cv-admin"
          ? "admin"
          : groupName === "cv-coach"
            ? "coach"
            : groupName === "cv-medical"
              ? "medical"
              : "athlete";

      const tier = "free";

      try {
        await dynamoClient.send(
          buildEntitlementsPut({
            tableName,
            userSub,
            tenantId,
            role,
            tier,
          })
        );

        console.log(
          "Entitlements upserted",
          JSON.stringify({ userSub, tenantId, role, tier, tableName }, null, 2)
        );
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          console.log(
            "entitlements_exists",
            JSON.stringify({ userSub, tenantId, role, tier, tableName }, null, 2)
          );
          return event;
        }
        throw err;
      }

      return event;
    } catch (err) {
      console.error(
        "post_confirmation_handler_error",
        JSON.stringify(
          {
            username,
            userSub,
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
}

const handler = createHandler();

module.exports = {
  handler,
  createHandler,
  createTenantId,
  resolveTenantId,
  buildEntitlementsPut,
};
