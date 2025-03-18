import requests
import csv

# CrossRef API endpoint
url = "https://api.crossref.org/works"

# List of subjects (you can modify these to match your interests)
subjects = [
    "Sociology", "Literature", "Language", "Social Sciences", "Medical practices and Nursing",
    "Education and Teaching Practices", "Civil Engineering", "Economics", "Account Management"
]

# Research method keywords to infer research methods from titles/abstracts
research_method_keywords = ['qualitative', 'quantitative', 'survey', 'case study', 'experiment',
                            'simulation', 'theoretical', 'modeling', 'field study']

# Open a CSV file to store the data
with open('orcid_from_crossref.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Author Name', 'ORCID ID', 'Title', 'DOI', 'Year', 'Citations', 'Research Method'])

    # Loop through each subject to fetch ORCID data
    for subject in subjects:
        print(f"Fetching data for subject: {subject}")
        params = {
            "query": subject,  # Search for papers related to the subject
            "rows": 100,  # Fetch up to 100 results per subject
            "filter": "has-orcid:true"  # Only get papers with ORCID IDs
        }

        # Send GET request to CrossRef API
        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()

            # Extract works and their author ORCID IDs
            for item in data['message']['items']:
                title = item.get('title', ['No Title'])[0]  # Get the title of the paper
                doi = item.get('DOI', 'No DOI')  # Get the DOI
                year = item.get('issued', {}).get('date-parts', [[None]])[0][0]  # Get the year of publication
                citations = item.get('is-referenced-by-count', 0)  # Get the citation count

                # Inference of research method based on title and abstract (if provided)
                abstract = item.get('abstract', '')
                research_methods_found = []
                for keyword in research_method_keywords:
                    if keyword.lower() in title.lower() or keyword.lower() in abstract.lower():
                        research_methods_found.append(keyword.capitalize())

                research_method = ', '.join(research_methods_found) if research_methods_found else 'Unknown Method'

                # Loop through the authors and extract ORCID details
                for author in item.get('author', []):
                    orcid = author.get('ORCID', 'No ORCID')
                    author_name = f"{author.get('given', '')} {author.get('family', '')}"

                    # Write author details, ORCID, title, DOI, year, citations, and research method to CSV
                    writer.writerow([author_name, orcid, title, doi, year, citations, research_method])

        else:
            print(f"Failed to fetch data for subject '{subject}'. Status code: {response.status_code}")

print("ORCID data exported to 'orcid_from_crossref.csv'")
