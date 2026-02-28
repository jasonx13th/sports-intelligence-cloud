# Week 1 – Day 2: SicAuthStack Deploy + PostConfirmation Lambda Test

## What we built today (the goal)

Day 2 was about turning the Day 1 auth design into **real, deployed infrastructure**:

- A working **Cognito User Pool** for SIC (dev)
- A working **Hosted UI Domain + App Client** for Club Vivo
- Role groups: `cv-admin`, `cv-coach`, `cv-medical`, `cv-athlete`
- A **PostConfirmation Lambda trigger** that assigns a user to a Cognito group
- A verified test flow with **CloudWatch logs**

---

## 1) CDK prerequisites: bootstrap

When we first tried to deploy, CDK failed with:

- `/cdk-bootstrap/hnb659fds/version not found`

Meaning the AWS environment wasn’t bootstrapped.

We fixed it by bootstrapping the account/region:

```bash
npx cdk bootstrap aws://333053098932/us-east-1
```

Result: `CDKToolkit` created successfully.

---

## 2) Deployed SicAuthStack-Dev

We deployed the stack successfully:

```bash
npx cdk deploy SicAuthStack-Dev
```

Outputs:

- `UserPoolId = us-east-1_WfcDqdxJh`
- `UserPoolDomain = https://club-vivo-dev.auth.us-east-1.amazoncognito.com`
- `ClubVivoWebClientId = 4ssfg7va608hn9uolatbhsma7g`

---

## 3) Cognito configuration validated in console

In Cognito (dev user pool):

### Groups created

- `cv-admin`
- `cv-coach`
- `cv-medical`
- `cv-athlete`

### Custom attributes

- `custom:tenant_id` exists ✅  
- `custom:requested_role` does not exist yet ❌  
  (We planned it, but did not add it to the schema today.)

### Trigger attachment verified

Extensions → Lambda triggers → Post confirmation:

- `sic-post-confirmation-dev` attached ✅

---

## 4) Deploy blockers and fixes (real production issues)

### A) CloudFormation circular dependency

Deploy initially failed due to a circular dependency between:

- Cognito User Pool trigger  
- Lambda policy referencing `userPoolArn`

Temporary MVP fix: loosened the IAM policy to avoid referencing the User Pool ARN:

```ts
resources: ['*'] // for cognito-idp:AdminAddUserToGroup
```

> Note: this is a temporary tradeoff. We will tighten permissions later.

---

### B) Lambda runtime error: Cannot find module 'aws-sdk'

Lambda test failed because Node.js 18 no longer includes AWS SDK v2 by default.

#### Fix:

Migrated Lambda to AWS SDK v3:

```
@aws-sdk/client-cognito-identity-provider
```

Added:

- `services/auth/post-confirmation/package.json`
- `services/auth/post-confirmation/package-lock.json`

Ran:

```bash
npm install
```

Redeployed stack.

Result: Lambda test succeeded after redeploy.

---

## 5) Dummy user test (tenant + group assignment + logs)

### A) Created a coach user

A Cognito user was created.  
The console UI did not expose custom attributes reliably at creation time.

---

### B) Set custom:tenant_id via CLI

We used the CLI to set:

```
custom:tenant_id = club-vivo-1234
```

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_WfcDqdxJh \
  --username 64a8a4a8-00c1-7051-8508-85d4005cea6c \
  --user-attributes Name=custom:tenant_id,Value=club-vivo-1234 \
  --region us-east-1
```

Confirmed in Cognito user attributes:

- `custom:tenant_id = club-vivo-1234` ✅

---

### C) Ran PostConfirmation Lambda test event

We ran a test event from the Lambda console simulating PostConfirmation.

Result:

- Lambda executed successfully ✅  
- User was added to `cv-athlete` ✅ (default behavior)

Confirmed in Cognito:

- Group membership shows `cv-athlete` ✅

---

### D) CloudWatch logs verified

CloudWatch log group:

```
/aws/lambda/sic-post-confirmation-dev
```

Logs showed:

- `PostConfirmation event ...`
- `User added to group ...`

Timezone note: CloudWatch was displaying timestamps in UTC  
(can switch to local timezone in UI).

---

## 6) What Day 2 accomplished

By the end of Day 2:

- ✅ `SicAuthStack-Dev` is deployed and working
- ✅ Cognito groups exist and match the platform role model
- ✅ `custom:tenant_id` attribute is working and visible on users
- ✅ PostConfirmation Lambda executes and assigns a group
- ✅ CloudWatch logs confirm end-to-end observability
- ✅ All code changes committed and pushed to GitHub (working tree clean)