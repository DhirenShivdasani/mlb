from flask_cors import CORS
import pandas as pd
import os
import psycopg2
import bcrypt
from flask import Flask, jsonify, request, session, redirect, url_for, render_template, Response
import re
import queue
import threading
import asyncio
import json

prod = False
DATABASE_URL = os.getenv('DATABASE_URL')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for sessions
CORS(app)


app.config['SESSION_TYPE'] = 'filesystem'

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

@app.route('/notify_new_data', methods=['POST'])
def notify_new_data():
    data = request.json
    message = data['message']
    for client in connected_clients:
        client.put(message)
    return jsonify({"status": "success"}), 200

async def notify_clients(message):
    if connected_clients:
        await asyncio.gather(*(client.send(message) for client in connected_clients))
    print(f"Sent message to {len(connected_clients)} clients")

@app.route('/events')
def events():
    def event_stream():
        messages = queue.Queue()
        connected_clients.add(messages)
        try:
            while True:
                message = messages.get()
                yield f'data: {message}\n\n'
        except GeneratorExit:
            connected_clients.remove(messages)
    
    return Response(event_stream(), content_type='text/event-stream')

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
    over_under = data['over_under']
    draftkings = data['draftkings']
    fanduel = data['fanduel']
    mgm = data['mgm']
    betrivers = data['betrivers']

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            INSERT INTO user_favorites (user_id, fcm_token, sport, player_name, over_under, draftkings, fanduel, mgm, betrivers)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (user_id, fcm_token, sport, player_name, over_under, draftkings, fanduel, mgm, betrivers))
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
    over_under = data['over_under']
    draftkings = data['draftkings']
    fanduel = data['fanduel']
    mgm = data['mgm']
    betrivers = data['betrivers']

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('''
            DELETE FROM user_favorites
            WHERE user_id = %s AND sport = %s AND player_name = %s AND over_under = %s AND draftkings = %s AND fanduel = %s AND mgm = %s AND betrivers = %s
        ''', (user_id, sport, player_name, over_under, draftkings, fanduel, mgm, betrivers))
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
            SELECT player_name, over_under, draftkings, fanduel, mgm, betrivers
            FROM user_favorites
            WHERE user_id = %s AND sport = %s
        ''', (user_id, sport))
        rows = cur.fetchall()
        favorites = [{'player_name': row[0], 'over_under': row[1], 'draftkings': row[2], 'fanduel': row[3], 'mgm': row[4], 'betrivers': row[5]} for row in rows]
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

def check_for_changes_and_notify(new_data, sport):
    global previous_data
    changes = []

    old_data = previous_data.get(sport)
    if old_data is not None:
        old_df = pd.DataFrame(old_data)
        for _, new_row in new_data.iterrows():
            old_row = old_df[(old_df['PlayerName'] == new_row['PlayerName']) & (old_df['Over_Under'] == new_row['Over_Under'])]
            if not old_row.empty:
                for column in ['draftkings', 'fanduel', 'mgm', 'betrivers']:
                    old_value = old_row[column].values[0]
                    new_value = new_row[column]
                    if old_value != new_value:
                        changes.append((new_row['PlayerName'], new_row['Over_Under'], column, new_value))

    if changes:
        conn = get_db_connection()
        cur = conn.cursor()
        for player_name, over_under, column, new_value in changes:
            cur.execute("SELECT user_id, fcm_token FROM user_favorites WHERE player_name = %s AND over_under = %s", (player_name, over_under))
            users = cur.fetchall()
            for user in users:
                email = user[0]
                message = f"{player_name} {over_under} {column} odds changed to {new_value}"
                asyncio.run(send_notification_to_user(user[0], message))
        cur.close()
        conn.close()

    previous_data[sport] = new_data.to_dict(orient='records')

async def send_notification_to_user(user_id, message):
    message_json = json.dumps(message)
    for client in connected_clients:
        await client.send(message_json)


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
    app.run(debug=True, use_reloader=False, port=port)
