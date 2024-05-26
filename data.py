from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
import shutil
from bs4 import BeautifulSoup
import pandas as pd
import requests 
# Set up Chrome options
chrome_options = Options()
chrome_options.add_experimental_option('prefs', {
    "download.default_directory": r"C:\Users\dhire\OneDrive\Desktop\code\MLB-player-prop-analysis",  # Change this to your preferred download directory
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})

# Set up the WebDriver
service = ChromeService(executable_path=ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

# Open the webpage
url = 'https://www.rotowire.com/baseball/stats.php'
driver.get(url)
time.sleep(3)

download_button = driver.find_element(By.CLASS_NAME, 'export-button.is-csv')
download_button.click()
headers = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF']
for h in headers:
    tab = driver.find_element(By.CSS_SELECTOR, f'div.filter-tab[data-name="{h}"]')
    tab.click()
    time.sleep(5)
    download_button = driver.find_element(By.XPATH, f'//*[@id="stats{h}"]/div[3]/div[2]/button[2]')
    download_button.click()
    time.sleep(2)

# Wait for the file to download
time.sleep(2)  # Adjust the sleep time if necessary

# # Close the driver
driver.quit()


url = 'https://swishanalytics.com/optimus/mlb/batter-vs-pitcher-stats'

# Send a GET request to the webpage
response = requests.get(url)
html_content = response.content

# Parse the HTML content
soup = BeautifulSoup(html_content, 'html.parser')

# Find the table in the HTML
header_row = soup.find('tr')
headers = [th.text.strip() for th in header_row.find_all('th')]

# Extract headers
headers = []
for th in table.find('thead').find_all('th'):
    headers.append(th.text.strip())

rows = []
for tr in soup.find('tbody').find_all('tr'):
    cells = tr.find_all('td')
    row = [cell.text.strip() for cell in cells]
    rows.append(row)

# Create a DataFrame
df = pd.DataFrame(rows, columns=headers)

# Save the DataFrame to a CSV file
df.to_csv('batter_vs_pitcher_stats.csv', index=False)

print("Table data has been extracted and saved to batter_vs_pitcher_stats.csv")