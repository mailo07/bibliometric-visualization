import requests
import time
BASE_URL = "http://localhost:8080/api/auth"

def test_auth():
    # Test data
    test_user = {
        "username": "poppy02" + str(int(time.time())),
        "password": "123456789"
    }
    
    # Test registration
    print("Testing registration...")
    resp = requests.post(
        f"{BASE_URL}/register",
        json=test_user
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")
    
    # Test login
    print("\nTesting login...")
    resp = requests.post(
        f"{BASE_URL}/login",
        json=test_user
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.json()}")

if __name__ == "__main__":
    test_auth()