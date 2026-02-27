// services/auth/post-confirmation/handler.js

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * Cognito PostConfirmation trigger.
 * - Reads custom:tenant_id and custom:requested_role attributes
 * - Adds the user to the appropriate Cognito group
 * - Logs structured information to CloudWatch
 */
exports.handler = async (event) => {
  const userPoolId = event.userPoolId;
  const username = event.userName;
  const attrs = event.request.userAttributes || {};

  const tenantId = attrs['custom:tenant_id'];
  const requestedRole = attrs['custom:requested_role']; // e.g. cv-admin, cv-coach, cv-medical, cv-athlete

  // Default role if none requested
  const groupName = requestedRole || 'cv-athlete';

  console.log(
    'PostConfirmation event',
    JSON.stringify(
      {
        triggerSource: event.triggerSource,
        userPoolId,
        username,
        tenantId,
        requestedRole,
        groupName,
      },
      null,
      2,
    ),
  );

  if (!tenantId) {
    console.warn(
      'User confirmed without tenant_id attribute',
      JSON.stringify(
        {
          userPoolId,
          username,
        },
        null,
        2,
      ),
    );
    // We allow it for now but log loudly; later we might throw to block confirmation
  }

  try {
    await cognito
      .adminAddUserToGroup({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      })
      .promise();

    console.log(
      'User added to group',
      JSON.stringify(
        {
          username,
          tenantId,
          groupName,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(
      'Failed to add user to group',
      JSON.stringify(
        {
          username,
          tenantId,
          groupName,
          errorMessage: err.message,
        },
        null,
        2,
      ),
    );
    // Re-throw so the trigger fails visibly if group assignment is broken
    throw err;
  }

  // Always return the event
  return event;
};