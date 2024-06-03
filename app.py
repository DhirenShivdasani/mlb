from flask_cors import CORS
from flask import Flask, jsonify, request
import asyncio
import websockets
import threading
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

connected_clients = set()

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
    start_server = websockets.serve(websocket_handler, "0.0.0.0", port)
    loop.run_until_complete(start_server)
    loop.run_forever()

@app.route('/merged_data', methods=['GET', 'POST'])
def get_merged_data():
    if request.method == 'POST':
        threading.Thread(target=asyncio.run, args=(notify_clients(),)).start()
    try:
        merged_data = pd.read_csv('merged_data.csv')
        return jsonify(merged_data.to_dict(orient='records'))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    threading.Thread(target=start_websocket_server, args=(port,)).start()
    app.run(debug=True, use_reloader=False, port=port)
