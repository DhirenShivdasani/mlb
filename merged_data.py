import pandas as pd

# Load the CSV files
betting_odds_data = pd.read_csv('mlb_props.csv')
prizepicks_data = pd.read_csv('test2.csv')


prizepicks_data = prizepicks_data[(prizepicks_data['Prop'] == 'Total Bases') | 
                                  (prizepicks_data['Prop'] == 'Pitcher Strikeouts') | 
                                  (prizepicks_data['Prop'] == 'Earned Runs Allowed')]
prop_types= {
    'Pitcher Strikeouts': 'Strikeouts',
    'Earned Runs Allowed': 'Earned Runs Allowed',
    'Total Bases': 'Total Bases'# example of making an indirect relationship
    # Add other mappings as required
}
prizepicks_data['Prop'] = prizepicks_data['Prop'].map(prop_types)

prop_types= {
    'strikeouts': 'Strikeouts',
    'runs': 'Earned Runs Allowed', 
    'bases': 'Total Bases'# example of making an indirect relationship
    # Add other mappings as required
}
betting_odds_data['Prop'] = betting_odds_data['Prop'].map(prop_types)

merged_data = pd.merge(betting_odds_data, prizepicks_data, left_on=['PlayerName', 'Prop'], right_on=['Name', 'Prop'], how='left')

r = merged_data.drop(['Team', 'Name', 'Unnamed: 0'], axis =1)

r =r.dropna(subset=['Value'])
r = r.where(pd.notnull(r), "None")

r.to_csv('merged_data.csv')