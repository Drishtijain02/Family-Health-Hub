import requests

# Set the URL of your OCR API endpoint
url = "http://localhost:8000/api/extract-text"

# Path to a sample medical report (replace with a real file path!)
file_path = "sample_report.jpg" 

print(f"Testing OCR API with file: {file_path}")

try:
    with open(file_path, "rb") as f:
        # Send a POST request with the file as multipart/form-data
        files = {"file": f}
        response = requests.post(url, files=files)
        
    print(f"\nStatus Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
    
except FileNotFoundError:
    print(f"\nError: Could not find the file '{file_path}'. Please place a sample image or PDF here or update the path.")
except requests.exceptions.ConnectionError:
    print("\nError: Could not connect to the server. Is main.py running on port 8000?")
