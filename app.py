from flask_cors import CORS
from flask import Flask, jsonify
import asyncio
import websockets
import threading
import pandas as pd
app = Flask(__name__)
CORS(app)

connected_clients = set()

async def notify_clients():
    while True:
        await asyncio.sleep(10)  # Adjust this as necessary
        if connected_clients:  # asyncio.wait doesn't accept an empty list
            message = "update"
            await asyncio.wait([client.send(message) for client in connected_clients])

async def register(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

async def websocket_handler(websocket, path):
    await register(websocket)

def start_websocket_server():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(websocket_handler, "0.0.0.0", 5000)
    loop.run_until_complete(start_server)
    loop.run_forever()
merged_data = pd.read_csv('merged_data.csv')

@app.route('/merged_data')
def get_merged_data():
    return jsonify(merged_data.to_dict(orient='records'))

if __name__ == '__main__':
    threading.Thread(target=start_websocket_server).start()

    app.run(debug=True)
