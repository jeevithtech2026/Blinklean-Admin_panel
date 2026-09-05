import os
import sys
import zipfile
import json
import urllib.request
import subprocess
import time

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Command failed: {cmd}\nError: {result.stderr}")
    return result.stdout.strip()

def main():
    print("=== Step 1: Updating Amplify SPA Custom Rewrite Rules ===")
    app_id = "d28weajb6kmn6d"
    region = "ap-south-1"

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

    cmd_update = f'aws amplify update-app --app-id {app_id} --custom-rules file://amplify_rules.json --region {region}'
    print("Executing:", cmd_update)
    out = run_cmd(cmd_update)
    print("SPA Custom Rules configured successfully.")

    print("\n=== Step 2: Creating POSIX Zip of dist/ ===")
    zip_path = "dist_posix.zip"
    if os.path.exists(zip_path):
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("dist"):
            for file in files:
                full_path = os.path.join(root, file)
                # POSIX path inside zip with forward slashes
                rel_path = os.path.relpath(full_path, "dist").replace("\\", "/")
                zipf.write(full_path, rel_path)
                print(f"  + Added: {rel_path}")

    zip_size = os.path.getsize(zip_path)
    print(f"Created {zip_path} ({zip_size} bytes)")

    print("\n=== Step 3: Requesting Amplify Create Deployment ===")
    cmd_create = f"aws amplify create-deployment --app-id {app_id} --branch-name main --region {region} --output json"
    create_res = json.loads(run_cmd(cmd_create))
    job_id = create_res["jobId"]
    upload_url = create_res["zipUploadUrl"]
    print(f"Job ID: {job_id}")
    print("Uploading zip artifact to AWS S3 presigned URL...")

    with open(zip_path, "rb") as f:
        data = f.read()

    req = urllib.request.Request(
        upload_url,
        data=data,
        headers={
            "Content-Type": "application/zip",
            "Content-Length": str(len(data))
        },
        method="PUT"
    )

    with urllib.request.urlopen(req) as response:
        print(f"Upload completed with HTTP status: {response.status}")

    print("\n=== Step 4: Starting Deployment Job ===")
    cmd_start = f"aws amplify start-deployment --app-id {app_id} --branch-name main --job-id {job_id} --region {region} --output json"
    start_res = json.loads(run_cmd(cmd_start))
    print("Deployment triggered:", start_res.get("jobSummary", {}).get("status"))

    print("\n=== Step 5: Monitoring Deployment Progress ===")
    for i in range(30):
        time.sleep(5)
        cmd_status = f"aws amplify get-job --app-id {app_id} --branch-name main --job-id {job_id} --region {region} --output json"
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
    if os.path.exists(zip_path):
        os.remove(zip_path)

if __name__ == "__main__":
    main()
