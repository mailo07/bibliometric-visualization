import axios from 'axios';

const API_URL = 'http://localhost:5000';

export async function fetchHelloMessage() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error(error);
    return { error: 'Could not fetch from Flask API.' };
  }
}
