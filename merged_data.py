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

# Load the CSV files
betting_odds_data = pd.read_csv('mlb_props.csv')
prizepicks_data = pd.read_csv('test2.csv')


prizepicks_data = prizepicks_data[(prizepicks_data['Prop'] == 'Total Bases') | 
                                  (prizepicks_data['Prop'] == 'Pitcher Strikeouts') | 
                                  (prizepicks_data['Prop'] == 'Runs')]
prop_types= {
    'Pitcher Strikeouts': 'Strikeouts',
    'Runs': 'Runs',
    'Total Bases': 'Total Bases'# example of making an indirect relationship
    # Add other mappings as required
}
prizepicks_data['Prop'] = prizepicks_data['Prop'].map(prop_types)

prop_types= {
    'strikeouts': 'Strikeouts',
    'runs': 'Runs', 
    'bases': 'Total Bases'# example of making an indirect relationship
    # Add other mappings as required
}
betting_odds_data['Prop'] = betting_odds_data['Prop'].map(prop_types)

merged_data = pd.merge(betting_odds_data, prizepicks_data, left_on=['PlayerName', 'Prop'], right_on=['Name', 'Prop'], how='left')

r = merged_data.drop(['Team', 'Name', 'Unnamed: 0'], axis =1)

r =r.dropna(subset=['Value'])
r = r.where(pd.notnull(r), "None")
r=r.drop_duplicates()
r.sort_values(by = 'fanduel', ascending=True, inplace = True)



r.to_csv('merged_data.csv')
upload_to_aws('merged_data.csv', BUCKET_NAME, 'merged_data.csv')


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
        repo_dir = '/app'  # This is the default Heroku directory
        os.chdir(repo_dir)
        print(f"Current directory: {os.getcwd()}")
        subprocess.check_call(['git', 'config', '--global', 'user.email', 'your_email@example.com'])
        subprocess.check_call(['git', 'config', '--global', 'user.name', 'Your Name'])
        subprocess.check_call(['git', 'add', '.'])
        subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'])
        subprocess.check_call(['git', 'push', 'origin', 'main'])
        print("Changes pushed to GitHub")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while pushing to GitHub: {e}")

s3_file = 'merged_data.csv'
local_file = 'merged_data.csv'

# Download the file from S3
if download_from_s3(BUCKET_NAME, s3_file, local_file):
    push_to_github()
else:
    print("Failed to download file from S3, not pushing to GitHub")