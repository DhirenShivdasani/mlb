from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import undetected_chromedriver as uc
from selenium.common.exceptions import TimeoutException
import time
import pandas as pd
from selenium.webdriver.common.by import By
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import subprocess
import shutil
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

def handle_remove_readonly(func, path, exc_info):
    import stat
    os.chmod(path, stat.S_IWRITE)
    func(path)

chrome_options = uc.ChromeOptions()
chrome_options.add_experimental_option("prefs", {"profile.managed_default_content_settings.images": 2})
chrome_options.add_argument("--disable-notifications")
chrome_options = uc.ChromeOptions()
chrome_options.add_argument("--headless")  # Run Chrome in headless mode
chrome_options.add_argument("--disable-gpu")  # Disable GPU acceleration
chrome_options.add_argument("--no-sandbox")  # Bypass OS security model
chrome_options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
chrome_options.add_argument("--window-size=1920x1080")  # Set window size for headless mode
chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

chrome_options.add_experimental_option("prefs", {
    "profile.default_content_setting_values.geolocation": 1, # 1:Allow, 2:Block
})

chrome_options.page_load_strategy = 'eager'  # Waits for the DOMContentLoaded event

if 'DYNO' in os.environ:
    chrome_options.binary_location = os.environ.get('GOOGLE_CHROME_BIN')
    driver = uc.Chrome(options=chrome_options)
else:
    driver = uc.Chrome(options=chrome_options)

print(f"Chrome binary location: {chrome_options.binary_location}")
print(f"Chromedriver path: {os.environ.get('CHROMEDRIVER_PATH')}")
driver.get("https://app.prizepicks.com/")
# time.sleep(5)

wait = WebDriverWait(driver, timeout = 10)  # Wait for up to 10 seconds
try:
    element = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/div[3]/div[3]/div/div/button')))
    element.click()
except Exception as e:
    print(f"Error: {e}")

ppPlayers = []

wait = WebDriverWait(driver, 10)  # Wait for up to 10 seconds
try:
    mlb_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='MLB']")))
    mlb_button.click()
except Exception as e:
    print(f"Error: {e}")

time.sleep(4)

try:
    stat_container = WebDriverWait(driver, 30).until(
        EC.visibility_of_element_located((By.CLASS_NAME, "stat-container"))
    )
except TimeoutException:
    print(driver.page_source)
    raise

categories = driver.find_element(By.CSS_SELECTOR, ".stat-container").text.split('\n')

for category in categories:
    driver.find_element(By.XPATH, f"//div[text()='{category}']").click()

    WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "#projections > ul"))
    )

    # Find all prop items under the specified container
    projectionsPP = driver.find_elements(By.CSS_SELECTOR, "#projections > ul > li")

    for projections in projectionsPP:
 
        goblin_icon = projections.find_elements(By.XPATH, ".//button[@aria-label='Open modal for Demons and Goblins']")
            
            # If the goblin icon is present, skip this prop
        if goblin_icon:
            continue
            
        names = projections.find_element(By.ID, "test-player-name").text
        team = projections.find_element(By.ID, 'test-team-position').text
        value = projections.find_element(By.CSS_SELECTOR, '.flex.flex-1.items-center.pr-2').text.strip()
        proptype = projections.find_element(By.CSS_SELECTOR, 'div.align-items-center > div.text-soClean-140').text.strip()
        
        # Find the player image
        image_element = projections.find_element(By.CSS_SELECTOR, 'img.h-16')
        image_url = image_element.get_attribute('src')
        players = {
            'Name': names,
            'Team': team,
            'Value': value,
            'Prop': proptype.replace("<wbr>", ""),
            'ImageURL': image_url
        }
        ppPlayers.append(players)

dfProps = pd.DataFrame(ppPlayers)
# CHANGE THE NAME OF THE FILE TO YOUR LIKING
dfProps.to_csv('test2.csv')

print("These are all of the props offered by PP.", '\n')
print(dfProps)
print('\n')
