from flask_cors import CORS
import asyncio
import websockets
import threading
import pandas as pd
import os
import psycopg2
import bcrypt
from flask import Flask, jsonify, request, session, send_from_directory,redirect, url_for,render_template

prod = False
DATABASE_URL = os.getenv('DATABASE_URL')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for sessions
CORS(app)

connected_clients = set()

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
            username VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized and users table created.")

init_db()

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

@app.route('/get_historical_data', methods=['GET'])
def get_historical_data():
    if 'user_id' not in session and os.getenv('PROD'):
        return jsonify({"error": "Unauthorized"}), 401

    print(f"Full request URL: {request.url}")
    print(f"Request args: {request.args}")
    player_name = request.args.get('player_name')
    prop = request.args.get('prop')

    print(f"Received player_name: {player_name}, prop: {prop}")  # Debug print


    if not player_name or not prop:
        return jsonify({"error": "Missing player_name or prop parameter"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()


    try:
        query = "SELECT timestamp, draftkings, fanduel, mgm, betrivers FROM odds WHERE player_name = %s AND prop = %s ORDER BY timestamp;"
        print(f"Executing query: {query} with player_name={player_name} and prop={prop}")
        cur.execute(query, (player_name, prop))
        rows = cur.fetchall()
        data = [{'timestamp': row[0], 'draftkings': row[1], 'fanduel': row[2], 'mgm': row[3], 'betrivers': row[4]} for row in rows]
        print("Fetched data:", data)
        return jsonify(data)
    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({"error": "Error fetching data"}), 500
    finally:
        cur.close()
        conn.close()


@app.route('/')
def index():
    if 'user_id' not in session and prod:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/merged_data', methods=['GET', 'POST'])
def get_merged_data():
    if 'user_id' not in session and prod:
        return jsonify({"error": "Unauthorized"}), 401
    if request.method == 'POST':
        threading.Thread(target=asyncio.run, args=(notify_clients(),)).start()
    try:
        merged_data = pd.read_csv('merged_data.csv')
        return jsonify(merged_data.sort_values(by='fanduel', ascending=True).to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# User authentication routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        username = data['username']
        password = data['password']
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute('''
                INSERT INTO users (username, password)
                VALUES (%s, %s)
            ''', (username, hashed_password))
            conn.commit()
            return jsonify({"status": "success"}), 201
        except psycopg2.IntegrityError:
            conn.rollback()
            return jsonify({"status": "error", "message": "Username already exists"}), 400
        finally:
            cur.close()
            conn.close()
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        username = data['username']
        password = data['password']
        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute('''
                SELECT id, password FROM users WHERE username = %s
            ''', (username,))
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
