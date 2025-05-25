from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite's default port
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print("Received data:", data)  # Add this for debugging
        # Your prediction logic here
        # For now, returning a dummy prediction
        return jsonify({"prediction": 0.5})
    except Exception as e:
        print("Error:", str(e))  # Add this for debugging
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1') 