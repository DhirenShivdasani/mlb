from flask import Flask, jsonify
import pandas as pd

from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# Load the merged data
merged_data = pd.read_csv('merged_data.csv')

@app.route('/merged_data')
def get_merged_data():
    return jsonify(merged_data.to_dict(orient='records'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)