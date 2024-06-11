import pandas as pd
import subprocess

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

subprocess.run(['git', 'config', '--global', 'user.email', 'dhiren3102@gmail.com'])
subprocess.run(['git', 'config', '--global', 'user.name', 'DhirenShivdasani'])
subprocess.run(['git', 'add', 'merged_data.csv'])
subprocess.run(['git', 'commit', '-m', 'Automated update of merged_data.csv'])
subprocess.run(['git', 'push', 'https://MLB_TOKEN@github.com/DhirenShivdasani/mlb.git'])