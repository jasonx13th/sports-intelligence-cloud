# Day 2 – AWS Account & CLI Setup

## Decisions

- One personal AWS account used as SIC sandbox.
- Root user used only for billing and account-level setup.
- Daily work done as IAM user `j-admin` with MFA.
- Monthly cost budget set to $5 with email alerts.

## CLI Configuration

- Region: us-east-1
- Output: json
- IAM user: j-admin

## Commands

```bash
aws --version
aws configure
aws sts get-caller-identity

# S3 test bucket
echo "Hello from Sports Intelligence Cloud Day 2" > sic-test.txt
aws s3 mb s3://sic-dev-jleom --region us-east-1
aws s3 cp sic-test.txt s3://sic-dev-jleom/
aws s3 ls s3://sic-dev-jleom/
```
