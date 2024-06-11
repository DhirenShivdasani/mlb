import requests
from bs4 import BeautifulSoup
import re
import json
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



url = 'https://www.rotowire.com/betting/mlb/player-props.php'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# List to hold each DataFrame
dfs = []

if response.status_code == 200:
    soup = BeautifulSoup(response.content, 'html.parser')
    script_tags = soup.find_all('script', text=re.compile('rwjs:ready'))

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
            master_df.drop(['firstName', 'lastName'], axis =1, inplace = True)

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

pivot_df.to_csv('mlb_props.csv', index = False)

upload_to_aws('mlb_props.csv', BUCKET_NAME, 'mlb_props.csv')
def push_to_heroku():
    try:
        subprocess.check_call(['git', 'add', '.'])
        subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'])
        subprocess.check_call(['git', 'push', 'origin', 'main'])
        print("Changes pushed to Heroku")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while pushing to Heroku: {e}")
push_to_heroku()
