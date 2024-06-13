import boto3
import os
from git import Repo

# Configuration
s3_bucket = os.getenv('BUCKET_NAME')
s3_files = ['mlb_props.csv', 'merged_data.csv']  # List of files to download
local_repo_path = '/app'  # Path to your local repository on Heroku
repo_url = 'https://github.com/DhirenShivdasani/mlb.git'
aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

# Initialize S3 client
s3 = boto3.client('s3', aws_access_key_id=aws_access_key, aws_secret_access_key=aws_secret_key)

# Download files from S3
for s3_file in s3_files:
    local_file_path = os.path.join(local_repo_path, s3_file)
    s3.download_file(s3_bucket, s3_file, local_file_path)

# Replace files in the local repository
repo = Repo(local_repo_path)
repo.git.add(A=True)
repo.index.commit('Update files from S3')
origin = repo.remote(name='origin')
origin.push()
