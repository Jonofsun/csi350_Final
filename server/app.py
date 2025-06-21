# server/app.py
import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# 1) load .env
load_dotenv()

# 2) configure Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

# 3) enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# 4) init Socket.IO (drops into threading by default)
socketio = SocketIO(app, cors_allowed_origins="*")

# 5) set up logging
logging.basicConfig(level=logging.INFO)

# 6) register routes (this imports server/routes.py)
from server import routes  # noqa: E402

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logging.info(f"Starting Flask‐SocketIO server on port {port}")
    # note: socketio.run wraps app.run
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
