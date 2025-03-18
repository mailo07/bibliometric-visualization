import requests
import csv
import time

# OpenAlex API endpoint
url = "https://api.openalex.org/works"

# List of subjects to fetch data for
subjects = [
    "Mathematics", "Literature", "Language", "Engineering", "Technology",
    "Hospitality and Management", "Business", "Law", "Economics", "Environmental Sciences"
]

# Research method keywords to infer research methods from titles/abstracts
research_method_keywords = ['qualitative', 'quantitative', 'survey', 'case study', 'experiment',
                            'simulation', 'theoretical', 'modeling', 'field study']

# Open a CSV file to write the data
with open('openalex_data.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Subject', 'Title', 'DOI', 'Year', 'Citations', 'Research Method', 'Timestamp'])

    # Loop through each subject and fetch data
    for subject in subjects:
        print(f"Fetching data for subject: {subject}")

        params = {
            "search": subject,  # Query the subject
            "per-page": 100     # Fetch up to 100 results per subject (adjust as needed)
        }

        # Send the request to OpenAlex API
        response = requests.get(url, params=params)

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()

            # Loop through each work and write the details to the CSV
            for item in data['results']:
                title = item.get('display_name', 'No Title')  # Get the title
                doi = item.get('doi', 'No DOI')  # Get the DOI
                year = item.get('publication_year', 'Unknown Year')  # Get the year
                citations = item.get('cited_by_count', 0)  # Citation count

                # Infer research methods from the title/abstract
                research_methods_found = []
                abstract = item.get('abstract', '')

                for keyword in research_method_keywords:
                    if keyword.lower() in title.lower() or keyword.lower() in abstract.lower():
                        research_methods_found.append(keyword.capitalize())

                research_method = ', '.join(research_methods_found) if research_methods_found else 'Unknown Method'

                # Add current timestamp for when the data was fetched
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

                # Write the data to the CSV file
                writer.writerow([subject, title, doi, year, citations, research_method, timestamp])

            print(f"Data fetched and saved for subject: {subject}")

        else:
            print(f"Failed to fetch data for subject: {subject}. Status code: {response.status_code}")

print("Data exported to 'openalex_data.csv'")
