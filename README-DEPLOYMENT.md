# AWS Production Integration and Deployment Guide
## BlinkLean Administrative Panel Infrastructure Handbook

This handbook serves as the definitive staging and production deployment guide for the **BlinkLean Admin Panel** Single Page Application (SPA) frontend and its accompanying **Node.js/Express Middleware Aggregation Service**. Follow these steps to secure, connect, domain-bind, and automate the deployment of your infrastructure on AWS.

---

### Section 1: AWS VPC & Networking Mapping

To ensure secure communication between the serverless Lambda backend and your private RDS databases (Customer DB and Partner DB), you must deploy the resources within the same AWS Virtual Private Cloud (VPC) using private subnets.

#### 1.1 VPC Subnet Selection
- **Private Subnets**: Allocate a minimum of two private subnets across different Availability Zones (AZs) for high availability. These subnets must not have direct route table entries pointing to an Internet Gateway. Instead, outbound internet routing (if required for third-party API calls) must go through a NAT Gateway located in a public subnet.
- **RDS Subnet Group**: Ensure both your Customer RDS Instance and Partner RDS Instance are associated with an RDS DB Subnet Group containing these private subnets.

#### 1.2 Security Group Configurations
To implement strict least-privilege security controls, configure two distinct Security Groups (SGs):

1. **Lambda Security Group (`sg-admin-backend`)**
   - **Inbound Rules**: Allow traffic on port `5000` (or `80`/`443`) from the Application Load Balancer (ALB) or API Gateway VPC endpoint.
   - **Outbound Rules**: 
     - Allow outbound traffic on port `5432` (for PostgreSQL) or `3306` (for MySQL) destination: RDS Security Group (`sg-rds-databases`).
     - Allow outbound traffic on port `443` destination: `0.0.0.0/0` (required for calling AWS Secrets Manager and Route 53 APIs).

2. **RDS Security Group (`sg-rds-databases`)**
   - **Inbound Rules**: Allow inbound TCP traffic on port `5432` (or `3306`) source: Lambda Security Group (`sg-admin-backend`).
   - **Outbound Rules**: Block all outbound traffic (database instances should not initiate external calls).

---

### Section 2: Environment Provisioning Matrix

Manage credentials and environment configurations strictly outside the codebase using AWS Secrets Manager and AWS Systems Manager Parameter Store.

#### 2.1 Configuration Key Matrix
The following variables must be configured before deploying to staging/production:

| Variable Name | Storage Location | Type | Purpose | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_ADMIN_API_GATEWAY_URL` | SSM Parameter Store | String | Frontend API Gateway URL | `https://api.admin.blinklean.com` |
| `CUSTOMER_DB_HOST` | SSM Parameter Store | String | Customer database cluster host | `customer-db.c123456.us-east-1.rds.amazonaws.com` |
| `PARTNER_DB_HOST` | SSM Parameter Store | String | Partner database cluster host | `partner-db.c123456.us-east-1.rds.amazonaws.com` |
| `CUSTOMER_DB_URL` | AWS Secrets Manager | SecureString | Full Customer DB URI | `postgresql://user:pass@host:5432/customer_db` |
| `PARTNER_DB_URL` | AWS Secrets Manager | SecureString | Full Partner DB URI | `postgresql://user:pass@host:5432/partner_db` |
| `JWT_SECRET` | AWS Secrets Manager | SecureString | JWT Token Encryption Key | `a-4096-bit-random-cryptographic-hash` |

#### 2.2 Storing Credentials in AWS Secrets Manager
1. Open the AWS Secrets Manager Console and click **Store a new secret**.
2. Select **Other type of secret**.
3. Create a Key/Value secret named **`AdminPanel/DatabaseSecrets`** and input:
   - Key: `CUSTOMER_DB_URL` | Value: `postgresql://<user>:<password>@<customer_rds_endpoint>:5432/customer_db`
   - Key: `PARTNER_DB_URL` | Value: `postgresql://<user>:<password>@<partner_rds_endpoint>:5432/partner_db`
   - Key: `JWT_SECRET` | Value: `[your-secure-jwt-passphrase]`
4. Click **Next**, assign appropriate tags, and click **Store**. The Lambda Execution Role must be granted `secretsmanager:GetSecretValue` permissions for this Secret ARN.

---

### Section 3: Subdomain & Route 53 Architecture

Map your custom administrative subdomain cleanly to your hosted resources using Route 53 hosted zones.

#### 3.1 Routing for Frontend Assets (AWS Amplify or CloudFront)
1. Open the **AWS Route 53 Console** and click on **Hosted Zones**.
2. Select the domain associated with the project (e.g., `yourdomain.com`).
3. Click **Create record** and configure:
   - **Record name**: `superadmin` (resulting in `superadmin.yourdomain.com`).
   - **Record type**: `A - Routes traffic to an IPv4 address and some AWS resources`.
   - **Alias**: Enable this toggle.
   - **Route traffic to**: Select **Alias to Amplify app** or **Alias to CloudFront distribution**, then choose your active distribution/app target ID.
   - **Routing policy**: Simple routing.
4. Click **Create records**. DNS updates will propagate globally within minutes.

---

### Section 4: CI/CD Pipeline Automation

Leverage Git-based CI/CD triggers to deploy the frontend dashboard to AWS Amplify Console, ensuring smooth client-side routing.

#### 4.1 AWS Amplify Console Build Specification
Deployments are governed by the `amplify.yml` file. Amplify triggers builds on every push to your release branch.

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 4.2 Single Page Application (SPA) Fallback Redirects
Because React uses client-side routing (React Router DOM), direct refreshes or bookmark requests for sub-paths (like `/dashboard/partners` or `/dashboard/logistics`) return `404 Not Found` errors when served by static storage. You must configure rewrite rules to redirect requests back to `index.html`.

In the **AWS Amplify Console**:
1. Select your app and navigate to **Rewrites and redirects** under **App Settings**.
2. Click **Edit** and add the following rule:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Save the configuration. This routes all pathing requests back to the main document page, letting React Router resolve the path dynamically.
