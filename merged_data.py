import pandas as pd
import subprocess
import os
import boto3
from botocore.exceptions import NoCredentialsError

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

def push_to_github():
    try:
        repo_dir = os.path.dirname(os.path.abspath(__file__))  # Get the current script directory
        os.chdir(repo_dir)
        print(f"Current directory: {os.getcwd()}")

        # Initialize git repository if not found
        if not os.path.exists(os.path.join(repo_dir, '.git')):
            subprocess.check_call(['git', 'init'])
            subprocess.check_call(['git', 'checkout', '-b', 'main'])
            subprocess.check_call(['git', 'remote', 'add', 'origin', 'https://github.com/DhirenShivdasani/mlb.git'])

        subprocess.check_call(['git', 'config', '--global', 'user.email', 'dhiren3102@gmail.com'])
        subprocess.check_call(['git', 'config', '--global', 'user.name', 'DhirenShivdasani'])

        # Check if there is an initial commit
        try:
            subprocess.check_call(['git', 'rev-parse', '--verify', 'HEAD'])
            initial_commit = False
        except subprocess.CalledProcessError:
            initial_commit = True

        if initial_commit:
            # Make an initial commit
            subprocess.check_call(['git', 'add', '.'])
            subprocess.check_call(['git', 'commit', '-m', 'Initial commit'])

        else:
            # Stash local changes if there is an initial commit
            subprocess.check_call(['git', 'stash'])

            # Pull the latest changes from the remote repository
            subprocess.check_call(['git', 'pull', '--rebase', 'origin', 'main'])

            # Apply the stashed changes
            subprocess.check_call(['git', 'stash', 'pop'])

        subprocess.check_call(['git', 'add', '.'])
        subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'])

        # Use the token from environment variables for authentication
        github_token = os.getenv('GITHUB_TOKEN')
        subprocess.check_call([
            'git', 'push', 'https://{}@github.com/DhirenShivdasani/mlb.git'.format(github_token), 'main'
        ])
        print("Changes pushed to GitHub")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while pushing to GitHub: {e}")

# Load the CSV files
betting_odds_data = pd.read_csv('mlb_props.csv')
prizepicks_data = pd.read_csv('test2.csv')

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

r.to_csv('merged_data.csv')
upload_to_aws('merged_data.csv', BUCKET_NAME, 'merged_data.csv')

s3_file = 'merged_data.csv'
local_file = 'merged_data.csv'

# Download the file from S3
if download_from_s3(BUCKET_NAME, s3_file, local_file):
    push_to_github()
else:
    print("Failed to download file from S3, not pushing to GitHub")
