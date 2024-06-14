import pandas as pd
import subprocess
import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
import shutil

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
        with open(local_file, 'r') as file:
            print("Content after download:\n", file.read())
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
        subprocess.check_call(['git', 'clone', repo_url, repo_dir])

        os.chdir(repo_dir)
        print(f"Current directory: {os.getcwd()}")

        # Configure Git
        subprocess.check_call(['git', 'config', '--global', 'user.email', 'dhiren3102@gmail.com'])
        subprocess.check_call(['git', 'config', '--global', 'user.name', 'DhirenShivdasani'])

        # Print the file content before and after the update
        with open('merged_data.csv', 'r') as file:
            print("Before update:\n", file.read())

        # Manually delete and recreate the file to ensure changes are recognized
        os.remove('merged_data.csv')

        # Create and write the updated data to the file
        with open('merged_data.csv', 'w') as file:
            r.to_csv(file, index=False)

        with open('merged_data.csv', 'r') as file:
            print("After update:\n", file.read())

        # Add and commit changes
        subprocess.check_call(['git', 'add', '-A'])  # Force add all changes
        subprocess.check_call(['git', 'status', '-v'])

        # Check for changes before attempting to commit
        result = subprocess.run(['git', 'status', '--porcelain'], stdout=subprocess.PIPE)
        if result.stdout.strip():
            # There are changes to commit
            subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'])
        else:
            print("No changes to commit")

        # Push changes to GitHub using the token for authentication
        subprocess.check_call(['git', 'push', 'origin', 'main', '--verbose'])
        print("Changes pushed to GitHub")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while pushing to GitHub: {e}")

# Load the CSV files
betting_odds_data = pd.read_csv('mlb_props.csv')
prizepicks_data = pd.read_csv('test2.csv')

# Debug print the initial data
print("Initial betting_odds_data:\n", betting_odds_data.head())
print("Initial prizepicks_data:\n", prizepicks_data.head())

prizepicks_data = prizepicks_data[(prizepicks_data['Prop'] == 'Total Bases') | 
                                  (prizepicks_data['Prop'] == 'Pitcher Strikeouts') | 
                                  (prizepicks_data['Prop'] == 'Runs')]
prop_types = {
    'Pitcher Strikeouts': 'Strikeouts',
    'Runs': 'Runs',
    'Total Bases': 'Total Bases'
}
prizepicks_data['Prop'] = prizepicks_data['Prop'].map(prop_types)

prop_types = {
    'strikeouts': 'Strikeouts',
    'runs': 'Runs', 
    'bases': 'Total Bases'
}
betting_odds_data['Prop'] = betting_odds_data['Prop'].map(prop_types)

merged_data = pd.merge(betting_odds_data, prizepicks_data, left_on=['PlayerName', 'Prop'], right_on=['Name', 'Prop'], how='left')

r = merged_data.drop(['Team', 'Name', 'Unnamed: 0'], axis=1)
r = r.dropna(subset=['Value'])
r = r.where(pd.notnull(r), "None")
r = r.drop_duplicates()
r.sort_values(by='fanduel', ascending=True, inplace=True)

# Debug print the merged data
print("Merged data:\n", r.head())

# Remove the existing file to force Git to recognize changes
if os.path.exists('merged_data.csv'):
    os.remove('merged_data.csv')

# Save the updated data to the file
r.to_csv('merged_data.csv', index=False)

upload_to_aws('merged_data.csv', BUCKET_NAME, 'merged_data.csv')

s3_file = 'merged_data.csv'
local_file = 'merged_data.csv'

# Download the file from S3
if download_from_s3(BUCKET_NAME, s3_file, local_file):
    push_to_github()
else:
    print("Failed to download file from S3, not pushing to GitHub")
