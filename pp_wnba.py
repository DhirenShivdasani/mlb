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

# def push_to_github():
#     try:
#         repo_url = 'https://github.com/DhirenShivdasani/mlb.git'
#         repo_dir = '/tmp/mlb-repo'  # Using /tmp directory for temporary cloning
#         github_token = os.getenv('GITHUB_TOKEN')

#         # Remove the existing repository directory if it exists
#         if os.path.exists(repo_dir):
#             shutil.rmtree(repo_dir, onerror=handle_remove_readonly)

#         # Clone the repository
#         subprocess.check_call(['git', 'clone', repo_url, repo_dir], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#         os.chdir(repo_dir)
#         print(f"Current directory: {os.getcwd()}")

#         # Print content before download
#         print("Content of test2.csv before download:")
#         if os.path.exists('test2.csv'):
#             with open('test2.csv', 'r') as file:
#                 print(file.read())

#         # Configure Git
#         subprocess.check_call(['git', 'config', '--global', 'user.email', 'dhiren3102@gmail.com'])
#         subprocess.check_call(['git', 'config', '--global', 'user.name', 'DhirenShivdasani'])


#         # Ensure file system registers the changes
#         time.sleep(2)

#         # Force update file timestamp
#         os.utime('test2.csv', None)

#         # Add and commit changes
#         subprocess.check_call(['git', 'add', 'test2.csv'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

#         # Print content after download
#         print("Content of test2.csv after download:")
#         with open('test2.csv', 'r') as file:
#             print(file.read())

#         # Check the status to ensure files are staged
#         status_result = subprocess.run(['git', 'status'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#         print("Git status output before commit:\n", status_result.stdout)

#         # Check for changes before attempting to commit
#         result = subprocess.run(['git', 'status', '--porcelain'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#         if result.stdout.strip():
#             # There are changes to commit
#             print("Changes detected. Committing...")
#             subprocess.check_call(['git', 'commit', '-m', 'Automated update by scheduler'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

#             # Print the diff to confirm changes
#             diff_result = subprocess.run(['git', 'diff', '--cached'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#             print("Git diff output:\n", diff_result.stdout)

#             # Push changes to GitHub using the token for authentication
#             repo_url_with_token = f'https://{github_token}@github.com/DhirenShivdasani/mlb.git'
#             subprocess.check_call(['git', 'push', repo_url_with_token, 'main'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#             print("Changes pushed to GitHub")
#         else:
#             print("No changes to commit")
#     except subprocess.CalledProcessError as e:
#         print(f"An error occurred while pushing to GitHub: {e.output.decode()}")

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

wait = WebDriverWait(driver, timeout = 20)  # Wait for up to 10 seconds
try:
    element = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/div[3]/div[3]/div/div/button')))
    element.click()
except Exception as e:
    print(f"Error: {e}")


ppPlayers = []


wait = WebDriverWait(driver, 10)  # Wait for up to 10 seconds
try:
    mlb_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='WNBA']")))
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


    # projectionsPP = WebDriverWait(driver, 2).until(
    #     EC.presence_of_all_elements_located((By.CSS_SELECTOR, "/html/body/div[1]/div/div[3]/div[1]/div/main/div/div[2]")))
    # print(projectionsPP)

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
        
        players = {
            'Name': names,
            'Team': team,
            'Value': value,
            'Prop': proptype.replace("<wbr>", "")
        }
        ppPlayers.append(players)

dfProps = pd.DataFrame(ppPlayers)
# CHANGE THE NAME OF THE FILE TO YOUR LIKING
dfProps.to_csv('test3.csv')

print("These are all of the props offered by PP.", '\n')
print(dfProps)
print('\n')

# push_to_github()
