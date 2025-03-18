import requests
import csv

# Define the CrossRef API endpoint
url = "https://api.crossref.org/works"

# List of subjects to fetch data for
subjects = [
    "Computer Science",
    "Social Science",
    "Literature",
    "Library Science",
    "Psychology",
    "Philosophy",
    "Mathematics",
    "Accounts & Management"
]

# Research method keywords to infer research methods from titles/abstracts
research_method_keywords = ['qualitative', 'quantitative', 'survey', 'case study', 'experiment',
                            'simulation', 'theoretical', 'modeling', 'field study']

# Open a CSV file to write the data
with open('crossref_data_multiple_subjects.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    # Adding extra columns for citation count, year, and inferred research method
    writer.writerow(['Subject', 'Title', 'Authors', 'DOI', 'Year', 'Citation Count', 'Cited By', 'Research Method'])

    # Loop through each subject and fetch data
    for subject in subjects:
        print(f"Fetching data for subject: {subject}")

        params = {
            "query": subject,
            "rows": 100  # Fetch up to 100 results per subject (adjust as needed)
        }

        # Send the request to CrossRef API
        response = requests.get(url, params=params)

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            items = data['message']['items']

            # Print number of results found for the subject
            print(f"Found {len(items)} results for {subject}")

            # Loop through each item (publication) and write the details to the CSV
            for item in items:
                title = item.get('title', ['No Title'])[0]  # Get the title
                doi = item.get('DOI', 'No DOI')  # Get the DOI
                year = item.get('issued', {}).get('date-parts', [[None]])[0][0]  # Get the year of publication
                citation_count = item.get('is-referenced-by-count', 0)  # Citation count
                # Get authors' names (if available)
                authors = ', '.join(
                    [f"{author.get('given', '')} {author.get('family', '')}" for author in item.get('author', [])])

                # Inference of research method based on title and abstract (if provided)
                abstract = item.get('abstract', '')
                research_methods_found = []
                for keyword in research_method_keywords:
                    if keyword.lower() in title.lower() or keyword.lower() in abstract.lower():
                        research_methods_found.append(keyword.capitalize())

                research_method = ', '.join(research_methods_found) if research_methods_found else 'Unknown Method'

                # Placeholder for 'Cited By' - CrossRef does not provide specific 'Cited By' info
                cited_by = 'Unavailable'  # CrossRef API does not provide detailed 'Cited By' information

                # Write the subject, title, authors, DOI, year, citation count, 'Cited By', and research method to the CSV
                writer.writerow([subject, title, authors, doi, year, citation_count, cited_by, research_method])

        else:
            print(f"Failed to fetch data for subject: {subject}. Status code: {response.status_code}")

print("Data exported to 'crossref_data_multiple_subjects.csv'")
