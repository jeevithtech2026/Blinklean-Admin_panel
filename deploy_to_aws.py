import os
import sys
import json
import subprocess
import time

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Command failed: {cmd}\nError: {result.stderr}")
    return result.stdout.strip()

def main():
    print("=== Step 1: Updating Amplify SPA Custom Rewrite Rules ===")
    app_id = "d3bjm3rslfypp7"
    region = "ap-south-1"
    profile = os.environ.get("AWS_PROFILE", "Blinklean")

    # Create custom rules JSON for Single Page Application
    custom_rules = [
        {
            "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
            "target": "/index.html",
            "status": "200"
        }
    ]
    with open("amplify_rules.json", "w") as f:
        json.dump(custom_rules, f)

    cmd_update = f'aws amplify update-app --app-id {app_id} --custom-rules file://amplify_rules.json --region {region} --profile {profile}'
    print("Executing:", cmd_update)
    out = run_cmd(cmd_update)
    print("SPA Custom Rules configured successfully.")

    print("\n=== Step 2: Triggering Amplify Build Deployment Job ===")
    cmd_start = f"aws amplify start-job --app-id {app_id} --branch-name main --job-type RELEASE --region {region} --profile {profile} --output json"
    start_res = json.loads(run_cmd(cmd_start))
    job_id = start_res.get("jobSummary", {}).get("jobId")
    print(f"Triggered Amplify Deployment Job ID: {job_id}")

    print("\n=== Step 3: Monitoring Deployment Progress ===")
    for i in range(40):
        time.sleep(5)
        cmd_status = f"aws amplify get-job --app-id {app_id} --branch-name main --job-id {job_id} --region {region} --profile {profile} --output json"
        job_info = json.loads(run_cmd(cmd_status))
        status = job_info.get("job", {}).get("summary", {}).get("status")
        print(f"[{i*5}s] Deployment Status: {status}")
        if status in ["SUCCEED", "FAILED", "CANCELLED"]:
            if status == "SUCCEED":
                print("\n========================================================")
                print(">>> AWS Amplify Deployment SUCCEEDED Successfully! <<<")
                print(f">>> Live App URL: https://main.{app_id}.amplifyapp.com <<<")
                print("========================================================")
            else:
                raise Exception(f"Deployment finished with status: {status}")
            break

    # Cleanup
    if os.path.exists("amplify_rules.json"):
        os.remove("amplify_rules.json")

if __name__ == "__main__":
    main()
