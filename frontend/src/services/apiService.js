import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const processMetricsData = (data) => {
const citationTrends = data.reduce((acc, item) => {
const year = item.year || item.publication_year || item.published;
if (year) {
const yearStr = String(year).substring(0, 4);
const existing = acc.find(x => x.year === yearStr);
if (existing) {
existing.citations += item.cited_by || item.citations || item.citation_count || 0;
} else {
acc.push({
year: yearStr,
citations: item.cited_by || item.citations || item.citation_count || 0
});
}
}
return acc;
}, []).sort((a, b) => a.year - b.year);

const authorMap = data.reduce((map, item) => {
const authors = item.author || item.authors || item.author_name;
if (authors) {
const authorList = typeof authors === 'string' ? authors.split(',').map(a => a.trim()) : [];
const citations = item.cited_by || item.citations || item.citation_count || 0;


  authorList.forEach(author => {
    if (author && author !== 'N/A') {
      if (!map[author]) {
        map[author] = 0;
      }
      map[author] += citations;
    }
  });
}
return map;
}, {});

const topAuthors = Object.entries(authorMap)
.map(([name, citations]) => ({ name, citations }))
.sort((a, b) => b.citations - a.citations)
.slice(0, 5);

const sourceMap = data.reduce((map, item) => {
const source = item.journal || item.publisher || item.source || 'Unknown';
if (!map[source]) {
map[source] = 0;
}
map[source]++;
return map;
}, {});

const publicationDistribution = Object.entries(sourceMap)
.map(([name, count]) => ({ name, count }))
.sort((a, b) => b.count - a.count)
.slice(0, 5);

return {
citationTrends,
topAuthors,
publicationDistribution
};
};

export const search = async (query, type = 'all') => {
try {
let endpoint = '/search';
if (type === 'authors') endpoint = '/search/authors';
else if (type === 'fields') endpoint = '/search/fields';
else if (type === 'works') endpoint = '/search/works';


const response = await axios.get(`${API_URL}${endpoint}`, {
  params: { query },
});
return response.data || [];
} catch (error) {
console.error('Error fetching search data:', error);
throw error;
}
};

export const getCleanedBibliometricData = async () => {
try {
const response = await axios.get(`${API_URL}/cleaned_bibliometric_data`);
return response.data;
} catch (error) {
console.error('Error fetching cleaned bibliometric data:', error);
throw error;
}
};

export const getCrossrefDataMultipleSubjects = async () => {
try {
const response = await axios.get(`${API_URL}/crossref_data_multiple_subjects`);
return response.data;
} catch (error) {
console.error('Error fetching crossref data:', error);
throw error;
}
};

export const getGoogleScholarData = async () => {
try {
const response = await axios.get(`${API_URL}/google_scholar_data`);
return response.data;
} catch (error) {
console.error('Error fetching google scholar data:', error);
throw error;
}
};

export const getOpenalexData = async () => {
try {
const response = await axios.get(`${API_URL}/openalex_data`);
return response.data;
} catch (error) {
console.error('Error fetching openalex data:', error);
throw error;
}
};

export const getScopusData = async () => {
try {
const response = await axios.get(`${API_URL}/scopus_data`);
return response.data;
} catch (error) {
console.error('Error fetching scopus data:', error);
throw error;
}
};

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

export const getBibliometricMetrics = async (query, type = 'all') => {
try {
const searchResults = await search(query, type);


if (searchResults && searchResults.length > 0) {
  const metrics = processMetricsData(searchResults);
  
  const scholarlyWorks = searchResults.length;
  const worksCited = searchResults.reduce((sum, item) => {
    return sum + (item.cited_by || item.citations || item.citation_count || 0);
  }, 0);
  const frequentlyCited = searchResults.filter(item => {
    return (item.cited_by || item.citations || item.citation_count || 0) > 10;
  }).length;
  
  return {
    ...metrics,
    scholarlyWorks,
    worksCited,
    frequentlyCited
  };
}

return {
  citationTrends: [],
  topAuthors: [],
  publicationDistribution: [],
  scholarlyWorks: 0,
  worksCited: 0,
  frequentlyCited: 0
};
} catch (error) {
console.error('Error fetching bibliometric metrics:', error);
return {
citationTrends: [],
topAuthors: [],
publicationDistribution: [],
scholarlyWorks: 0,
worksCited: 0,
frequentlyCited: 0
};
}
};