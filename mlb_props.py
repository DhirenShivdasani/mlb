import requests
from bs4 import BeautifulSoup
import re
import json
import pandas as pd
import subprocess
import os
import shutil
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
import time
# Load environment variables from .env file
load_dotenv()

# Initialize S3 client
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

BUCKET_NAME = os.getenv('BUCKET_NAME')

def upload_to_aws(local_file, bucket, s3_file):
    try:
        s3.upload_file(local_file, bucket, s3_file)
        print(f"Upload Successful: {s3_file}")
        return True
    except FileNotFoundError:
        print("The file was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False

def download_from_s3(bucket, s3_file, local_file):
    try:
        s3.download_file(bucket, s3_file, local_file)
        print(f"Download Successful: {s3_file}")
        return True
    except FileNotFoundError:
        print("The file was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False

def handle_remove_readonly(func, path, exc_info):
    import stat
    os.chmod(path, stat.S_IWRITE)
    func(path)

def push_to_github():
    try:
        repo_url = 'https://github.com/DhirenShivdasani/mlb.git'
        repo_dir = '/tmp/mlb-repo'  # Using /tmp directory for temporary cloning
        github_token = os.getenv('GITHUB_TOKEN')

        # Remove the existing repository directory if it exists
        if os.path.exists(repo_dir):
            shutil.rmtree(repo_dir, onerror=handle_remove_readonly)

        # Clone the repository
        subprocess.check_call(['git', 'clone', repo_url, repo_dir], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        os.chdir(repo_dir)
        print(f"Current directory: {os.getcwd()}")

        # Print content before download
        print("Content of merged_data.csv before download:")
        if os.path.exists('mlb_props.csv'):
            with open('mlb_props.csv', 'r') as file:
                print(file.read())

        # Configure Git
        subprocess.check_call(['git', 'config', '--global', 'user.email', 'dhiren3102@gmail.com'])
        subprocess.check_call(['git', 'config', '--global', 'user.name', 'DhirenShivdasani'])

        # Download the file from S3 again
        download_from_s3(BUCKET_NAME, 'mlb_props.csv', 'mlb_props.csv')

        # Ensure file system registers the changes
        time.sleep(2)

        # Force update file timestamp
        os.utime('mlb_props.csv', None)

        # Add and commit changes
        subprocess.check_call(['git', 'add', 'mlb_props.csv'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Print content after download
        print("Content of mlb_props.csv after download:")
        with open('mlb_props.csv', 'r') as file:
            print(file.read())

        # Check the status to ensure files are staged
        status_result = subprocess.run(['git', 'status'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print("Git status output before commit:\n", status_result.stdout)

        # Check for changes before attempting to commit
        result = subprocess.run(['git', 'status', '--porcelain'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.stdout.strip():
            # There are changes to commit
            print("Changes detected. Committing...")
            subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            # Print the diff to confirm changes
            diff_result = subprocess.run(['git', 'diff', '--cached'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print("Git diff output:\n", diff_result.stdout)

            # Push changes to GitHub using the token for authentication
            repo_url_with_token = f'https://{github_token}@github.com/DhirenShivdasani/mlb.git'
            subprocess.check_call(['git', 'push', repo_url_with_token, 'main'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("Changes pushed to GitHub")
        else:
            print("No changes to commit")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while pushing to GitHub: {e.output.decode()}")

url = 'https://www.rotowire.com/betting/mlb/player-props.php'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# List to hold each DataFrame
dfs = []

if response.status_code == 200:
    soup = BeautifulSoup(response.content, 'html.parser')
    script_tags = soup.find_all('script', string=re.compile('rwjs:ready'))

    for script in script_tags:
        js_code = script.string
        json_like_object = re.search(r'data: (\[.*\])', js_code)
        if json_like_object:
            json_str = json_like_object.group(1)
            # Convert JSON string to DataFrame
            data = json.loads(json_str)
            df = pd.DataFrame(data)
            dfs.append(df)

            master_df = pd.concat(dfs, ignore_index=True)
            master_df['PlayerName'] = master_df['firstName'] + ' ' + master_df['lastName']
            master_df.drop(['firstName', 'lastName'], axis=1, inplace=True)

sportsbooks = ['draftkings', 'fanduel', 'mgm', 'betrivers']
props = ['strikeouts', 'bases', 'runs']

# Flatten each prop for each sportsbook into separate DataFrames
flattened_dfs = []
for prop in props:
    for sportsbook in sportsbooks:
        # Include prop value columns
        cols = [f'{sportsbook}_{prop}Under', f'{sportsbook}_{prop}Over', f'{sportsbook}_{prop}']
        temp_df = master_df[['PlayerName', 'team', 'opp'] + cols].copy()
        temp_df['Prop'] = prop
        temp_df['Sportsbook'] = sportsbook
        
        # Melt the DataFrame
        temp_df = temp_df.melt(id_vars=['PlayerName', 'team', 'opp', 'Prop', 'Sportsbook', f'{sportsbook}_{prop}'], 
                               value_vars=[f'{sportsbook}_{prop}Under', f'{sportsbook}_{prop}Over'], 
                               var_name='Over_Under', 
                               value_name='Odds')
        
        # Clean the Over_Under column
        temp_df['Over_Under'] = temp_df['Over_Under'].apply(lambda x: 'Over' if 'Over' in x else 'Under')

        # Combine odds and value into a single column
        temp_df['Odds_Value'] = temp_df.apply(
            lambda row: f"({row[f'{sportsbook}_{prop}']}) {row['Odds']}" if pd.notnull(row[f'{sportsbook}_{prop}']) else None, 
            axis=1
        )
        flattened_dfs.append(temp_df)
consolidated_df = pd.concat(flattened_dfs)

# Step 3: Consolidate Sportsbook Odds and Values
pivot_df = consolidated_df.pivot_table(index=['PlayerName', 'team', 'opp', 'Prop', 'Over_Under'], 
                                       columns='Sportsbook', 
                                       values='Odds_Value', 
                                       aggfunc='first').reset_index()
pivot_df.replace('() nan', None, inplace=True)

pivot_df.to_csv('mlb_props.csv', index=False)

upload_to_aws('mlb_props.csv', BUCKET_NAME, 'mlb_props.csv')

s3_file = 'mlb_props.csv'
local_file = 'mlb_props.csv'

# Download the file from S3
if download_from_s3(BUCKET_NAME, s3_file, local_file):
    push_to_github()
else:
    print("Failed to download file from S3, not pushing to GitHub")
