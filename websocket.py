import asyncio
import websockets

connected_clients = set()

async def websocket_handler(websocket, path):
    # Add the new client to the connected_clients set
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            # Handle incoming messages here (if any)
            pass
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Client disconnected: {e}")
    finally:
        # Remove the client from the connected_clients set
        connected_clients.remove(websocket)

async def start_websocket_server():
    server = await websockets.serve(websocket_handler, '0.0.0.0', 8766)
    await server.wait_closed()

if __name__ == '__main__':
    asyncio.run(start_websocket_server())
