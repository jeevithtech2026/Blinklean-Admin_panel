import os
import zipfile
import subprocess
import json

def deploy_lambda():
    lambda_zip = 'server_lambda.zip'
    if os.path.exists(lambda_zip):
        os.remove(lambda_zip)

    include_dirs = ['config', 'middleware', 'routes', 'utils', 'node_modules']
    include_files = ['index.js', 'lambda.js', 'package.json']

    print('Creating lambda zip...')
    with zipfile.ZipFile(lambda_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in include_files:
            full = os.path.join('server', f)
            if os.path.exists(full):
                z.write(full, f)
        
        for d in include_dirs:
            dir_path = os.path.join('server', d)
            for root, _, files in os.walk(dir_path):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, 'server').replace('\\', '/')
                    z.write(full_path, rel_path)

    size_mb = os.path.getsize(lambda_zip) / (1024 * 1024)
    print(f'Lambda zip created: {lambda_zip} ({size_mb:.2f} MB)')

    cmd = 'aws lambda update-function-code --function-name blinklean-admin-backend-s-AdminAggregationFunction-xQhJXa8Ju593 --zip-file fileb://server_lambda.zip --region ap-south-1 --output json'
    print('Updating AWS Lambda code...')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        out = json.loads(result.stdout)
        print('Lambda update SUCCEEDED! LastModified:', out.get('LastModified'))
    else:
        print('Lambda update FAILED:', result.stderr)

    if os.path.exists(lambda_zip):
        os.remove(lambda_zip)

if __name__ == '__main__':
    deploy_lambda()
