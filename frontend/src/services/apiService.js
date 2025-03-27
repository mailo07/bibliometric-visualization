import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Flask backend base URL

// 🔍 Search API
export const search = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching search data:', error);
    throw error;
  }
};

// 📘 Cleaned Bibliometric Data
export const getCleanedBibliometricData = async () => {
  try {
    const response = await axios.get(`${API_URL}/cleaned_bibliometric_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cleaned bibliometric data:', error);
    throw error;
  }
};

// 🔬 CrossRef Data
export const getCrossrefDataMultipleSubjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/crossref_data_multiple_subjects`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crossref data:', error);
    throw error;
  }
};

// 🎓 Google Scholar Data
export const getGoogleScholarData = async () => {
  try {
    const response = await axios.get(`${API_URL}/google_scholar_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching google scholar data:', error);
    throw error;
  }
};

// 🌐 OpenAlex Data
export const getOpenalexData = async () => {
  try {
    const response = await axios.get(`${API_URL}/openalex_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching openalex data:', error);
    throw error;
  }
};

// 📚 Scopus Data
export const getScopusData = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data:', error);
    throw error;
  }
};

// 📘 Scopus Data (September Version)
export const getScopusDataSept = async () => {
  try {
    const response = await axios.get(`${API_URL}/scopus_data_sept`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scopus data sept:', error);
    throw error;
  }
};

export const getBibliometricVideos = async () => {
  try {
    const response = await axios.get(`${API_URL}/youtube_bibliometrics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
};