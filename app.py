from flask_cors import CORS
import asyncio
import websockets
import threading
import pandas as pd
import os
import psycopg2
import bcrypt
from flask import Flask, jsonify, request, session, redirect, url_for, render_template
import re
# import firebase_admin
# from firebase_admin import credentials, messaging
from flask_session import Session

prod = False
DATABASE_URL = os.getenv('DATABASE_URL')
# DATABASE_URL ='postgres://u6aoo300n98jv9:p5b0f8d8acf4792b0bfd49cb4f620561db87f220ced59f5ad9d729ddda6cbfc97@cd5gks8n4kb20g.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/doo2eame5lshp'
# cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for sessions
CORS(app)
     
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)


connected_clients = set()
previous_data = {}  # Store previous data in memory


def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Database connection successful")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized and users table created.")

init_db()

def is_valid_email(email):
    regex = '^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w+$'
    if re.search(regex, email):
        return True
    else:
        return False

async def notify_clients():
    if connected_clients:
        message = "update"
        await asyncio.gather(*(client.send(message) for client in connected_clients))

async def register(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

async def websocket_handler(websocket, path):
    await register(websocket)

def start_websocket_server(port):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(websocket_handler, "0.0.0.0", port + 1)  # WebSocket on different port
    loop.run_until_complete(start_server)
    loop.run_forever()

def send_push_notification(fcm_token, title, body):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=fcm_token,
    )
    response = messaging.send(message)
    print('Successfully sent message:', response)

def check_for_changes_and_notify(new_data, sport):
    global previous_data
    changes = []
    
    old_data = previous_data.get(sport)
    if old_data is not None:
        old_df = pd.DataFrame(old_data)
        for _, new_row in new_data.iterrows():
            old_row = old_df[(old_df['PlayerName'] == new_row['PlayerName']) & (old_df['Prop'] == new_row['Prop'])]
            if not old_row.empty:
                for column in ['draftkings', 'fanduel', 'mgm', 'betrivers']:
                    old_value = old_row[column].values[0]
                    new_value = new_row[column]
                    if old_value != new_value:
                        changes.append((new_row['PlayerName'], new_row['Prop'], column, new_value))

    if changes:
        conn = get_db_connection()
        cur = conn.cursor()
        for player_name, prop, column, new_value in changes:
            cur.execute("SELECT fcm_token FROM user_favorites WHERE player_name = %s AND prop = %s", (player_name, prop))
            tokens = cur.fetchall()
            for token in tokens:
                send_push_notification(token[0], 'Prop Update', f"{player_name} {prop} {column} odds changed to {new_value}")
        cur.close()
        conn.close()

    previous_data[sport] = new_data.to_dict(orient='records')

@app.route('/get_historical_data', methods=['GET'])
def get_historical_data():
    if 'user_id' not in session and os.getenv('PROD'):
        return jsonify({"error": "Unauthorized"}), 401

    player_name = request.args.get('player_name')
    prop = request.args.get('prop')
    over_under = request.args.get('over_under')
    sport = request.args.get('sport', 'mlb')  # Default to 'mlb' if sport is not provided

    if not player_name or not prop or not over_under:
        return jsonify({"error": "Missing player_name, prop, or over_under parameter"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = f"""
        SELECT timestamp, draftkings, fanduel, mgm, betrivers 
        FROM {sport} 
        WHERE player_name = %s AND prop = %s AND over_under = %s 
        ORDER BY timestamp;
        """
        cur.execute(query, (player_name, prop, over_under))
        rows = cur.fetchall()
        data = [{'timestamp': row[0], 'draftkings': row[1], 'fanduel': row[2], 'mgm': row[3], 'betrivers': row[4]} for row in rows]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Error fetching data"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/')
def index():
    if 'user_id' not in session and prod:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/favorite_prop', methods=['POST'])
def favorite_prop():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    user_id = session['user_id']
    fcm_token = data['fcm_token']
    sport = data['sport']
    player_name = data['player_name']
    prop = data['prop']
    over_under = data['over_under']

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO user_favorites (user_id, fcm_token, sport, player_name, prop, over_under)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (user_id, fcm_token, sport, player_name, prop, over_under))
        conn.commit()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/remove_favorite_prop', methods=['POST'])
def remove_favorite_prop():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    user_id = session['user_id']
    sport = data['sport']
    player_name = data['player_name']
    prop = data['prop']
    over_under = data['over_under']

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            DELETE FROM user_favorites
            WHERE user_id = %s AND sport = %s AND player_name = %s AND prop = %s AND over_under = %s
        ''', (user_id, sport, player_name, prop, over_under))
        conn.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/get_favorite_props', methods=['GET'])
def get_favorite_props():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session['user_id']
    sport = request.args.get('sport', 'mlb')

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            SELECT player_name, prop, over_under
            FROM user_favorites
            WHERE user_id = %s AND sport = %s
        ''', (user_id, sport))
        rows = cur.fetchall()
        favorites = [{'player_name': row[0], 'prop': row[1], 'over_under': row[2]} for row in rows]
        return jsonify(favorites)
    except Exception as e:
        return jsonify({"error": "Error fetching favorite props"}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/merged_data', methods=['GET', 'POST'])
def get_merged_data():
    if 'user_id' not in session and prod:
        return jsonify({"error": "Unauthorized"}), 401
    if request.method == 'POST':
        threading.Thread(target=asyncio.run, args=(notify_clients(),)).start()

        sport = request.args.get('sport', 'mlb')
        new_data = pd.read_csv(f'merged_{sport}.csv')
        check_for_changes_and_notify(new_data, sport)

    sport = request.args.get('sport', 'mlb')

    try:
        merged_data = pd.read_csv(f'merged_{sport}.csv')
        return jsonify(merged_data.sort_values(by='fanduel', ascending=True).to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        email = data['email']
        password = data['password']
        
        if not is_valid_email(email):
            return jsonify({"status": "error", "message": "Email is invalid"}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute('''
                INSERT INTO users (email, password)
                VALUES (%s, %s)
            ''', (email, hashed_password))
            conn.commit()
            return jsonify({"status": "success"}), 201
        except psycopg2.IntegrityError:
            conn.rollback()
            return jsonify({"status": "error", "message": "Email already exists"}), 400
        finally:
            cur.close()
            conn.close()
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        email = data['email']
        password = data['password']
        
        if not is_valid_email(email):
            return jsonify({"status": "error", "message": "Email is invalid"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute('''
                SELECT id, password FROM users WHERE email = %s
            ''', (email,))
            user = cur.fetchone()
            if user and bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
                session['user_id'] = user[0]
                return jsonify({"status": "success"}), 200
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        except psycopg2.Error as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            cur.close()
            conn.close()
    return render_template('login.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    threading.Thread(target=start_websocket_server, args=(port,)).start()
    app.run(debug=True, use_reloader=False, port=port)