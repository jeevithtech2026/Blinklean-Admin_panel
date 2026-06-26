const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Route53Client, ListResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

// ANSI Terminal Colors for telemetric log formatting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SECRET_ID = 'AdminPanel/DatabaseSecrets';
const HOSTED_ZONE_ID = process.env.AWS_HOSTED_ZONE_ID || 'Z00000000000000000000';
const TARGET_SUBDOMAIN = process.env.ADMIN_SUBDOMAIN || 'superadmin.yourdomain.com';

async function runAwsVerification() {
  console.log(`${BLUE}[AWS Diagnostic] Starting production infrastructure verification checks...${RESET}\n`);

  let secretsClient;
  let route53Client;

  try {
    // --------------------------------------------------------------------------
    // Process 1 & 2: AWS Secrets Manager Authentication & Structural Diagnostics
    // --------------------------------------------------------------------------
    console.log(`[Secrets Manager] Connecting to Secrets Manager in region: ${REGION}`);
    secretsClient = new SecretsManagerClient({ region: REGION });

    const getSecretCommand = new GetSecretValueCommand({ SecretId: SECRET_ID });
    
    console.log(`[Secrets Manager] Fetching secrets payload for secret ID: "${SECRET_ID}"`);
    const secretResponse = await secretsClient.send(getSecretCommand);
    
    if (!secretResponse.SecretString) {
      throw new Error(`SecretString is missing or empty inside "${SECRET_ID}".`);
    }

    console.log(`${GREEN}[Success] Process 1: Successfully connected to Secrets Manager and read secret payload.${RESET}`);

    // Parse and inspect internal key structures (Dry-Run Verification)
    const secretJson = JSON.parse(secretResponse.SecretString);
    const requiredKeys = ['CUSTOMER_DB_URL', 'PARTNER_DB_URL', 'JWT_SECRET'];
    const missingKeys = [];

    requiredKeys.forEach((key) => {
      if (!secretJson[key]) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      console.warn(`${YELLOW}[Warning] Process 2 Check Failed: Missing parameters in Secrets Manager payload: [${missingKeys.join(', ')}]${RESET}`);
    } else {
      console.log(`${GREEN}[Success] Process 2: Dry-run check passed. All required configuration keys (CUSTOMER_DB_URL, PARTNER_DB_URL, JWT_SECRET) are structurally present.${RESET}`);
    }

  } catch (error) {
    console.error(`${RED}[Failure] Secrets Manager Verification failed:${RESET}`);
    console.error(`  Error Code: ${error.name || 'Unknown'}`);
    console.error(`  Error Message: ${error.message || error}`);
    console.error(`  Resolution Hint: Verify AWS local credentials (e.g. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) and check if your IAM role permits 'secretsmanager:GetSecretValue' against "${SECRET_ID}".\n`);
  }

  try {
    // --------------------------------------------------------------------------
    // Process 3: Route 53 Host DNS Record Mapping Verifications
    // --------------------------------------------------------------------------
    console.log(`[Route 53] Connecting to Route 53 DNS query manager...`);
    route53Client = new Route53Client({ region: REGION });

    const listRecordsCommand = new ListResourceRecordSetsCommand({
      HostedZoneId: HOSTED_ZONE_ID
    });

    console.log(`[Route 53] Querying Hosted Zone ID "${HOSTED_ZONE_ID}" for resource record sets...`);
    const recordResponse = await route53Client.send(listRecordsCommand);

    const recordSets = recordResponse.ResourceRecordSets || [];
    
    // Normalize target subdomain string comparison (add trailing dot if missing as returned by AWS Route 53)
    const targetQuery = TARGET_SUBDOMAIN.endsWith('.') ? TARGET_SUBDOMAIN.toLowerCase() : `${TARGET_SUBDOMAIN.toLowerCase()}.`;
    
    const matchedRecord = recordSets.find((record) => record.Name.toLowerCase() === targetQuery);

    if (matchedRecord) {
      console.log(`${GREEN}[Success] Process 3: Subdomain record mapping resolved.${RESET}`);
      console.log(`  Name: ${matchedRecord.Name}`);
      console.log(`  Type: ${matchedRecord.Type}`);
      
      if (matchedRecord.AliasTarget) {
        console.log(`  Alias Target (CloudFront/Amplify): ${matchedRecord.AliasTarget.DNSName}`);
      } else if (matchedRecord.ResourceRecords) {
        matchedRecord.ResourceRecords.forEach((res) => {
          console.log(`  Resource Record: ${res.Value}`);
        });
      }
    } else {
      console.warn(`${YELLOW}[Warning] Process 3 Check Failed: Target subdomain "${TARGET_SUBDOMAIN}" could not be found inside the hosted zone record sets.${RESET}`);
    }

  } catch (error) {
    console.error(`${RED}[Failure] Route 53 DNS verification checks failed:${RESET}`);
    console.error(`  Error Code: ${error.name || 'Unknown'}`);
    console.error(`  Error Message: ${error.message || error}`);
    console.error(`  Resolution Hint: Verify if the AWS Hosted Zone ID "${HOSTED_ZONE_ID}" exists, and check if your IAM user possesses 'route53:ListResourceRecordSets' permissions.\n`);
  } finally {
    // Clean up AWS Client connection pools
    if (secretsClient) secretsClient.destroy();
    if (route53Client) route53Client.destroy();
  }

  console.log(`\n${BLUE}[AWS Diagnostic] Checks sequence finished.${RESET}`);
}

// Run diagnostic script immediately
runAwsVerification();
