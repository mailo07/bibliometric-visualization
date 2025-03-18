import time
from scholarly import scholarly
import csv

# List of well-known authors or scholars from top universities around the world
author_queries = [
    'Noam Chomsky',         # MIT (Linguistics)
    'Amartya Sen',          # Harvard University (Economics)
    'Richard Feynman',      # Caltech (Physics)
    'Yuval Noah Harari',    # Hebrew University (History)
    'Jane Goodall',         # Cambridge University (Ethology, Anthropology)
    'Stephen Jay Gould',    # Harvard University (Paleontology)
    'Michael Porter',       # Harvard University (Economics, Business Strategy)
    'Paul Krugman',         # Princeton University (Economics)
    'Michio Kaku',          # City University of New York (Theoretical Physics)
    'Tim Berners-Lee',      # MIT (Computer Science)
    'Sheryl Sandberg',      # Harvard University (Business, Technology)
    'Neil deGrasse Tyson',  # Princeton University (Astrophysics)
    'Elinor Ostrom',        # Indiana University (Political Science)
    'Thomas Piketty',       # Paris School of Economics (Economics)
]

# List of subjects to extract from titles/abstracts
subject_keywords = ['mathematics', 'literature', 'language', 'social sciences', 'computer science',
                    'sciences', 'library sciences', 'medicine', 'engineering']

# List of research method keywords to look for
research_method_keywords = ['qualitative', 'quantitative', 'survey', 'case study', 'experiment',
                            'simulation', 'theoretical', 'modeling', 'field study']

# Open a CSV file to store author publications
with open('google_scholar_data.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Author Name', 'Title', 'Year', 'Cited By', 'Subject of Study', 'Research Method'])

    # Loop through each author or query
    for query in author_queries:
        try:
            # Search for the author
            print(f"Searching for author: {query}")
            search_query = scholarly.search_author(query)
            author = scholarly.fill(next(search_query))

            print(f"Fetching data for author: {author['name']}")

            # Loop through each publication of the author
            for pub in author['publications']:
                print(f"Fetching publication details for: {pub['bib']['title']}")
                pub_info = scholarly.fill(pub)

                # Get publication details
                title = pub_info['bib'].get('title', 'No Title')
                year = pub_info['bib'].get('pub_year', 'Unknown Year')
                cited_by = pub_info.get('num_citations', 0)

                # Extract subject (based on keywords in title or abstract)
                subject_keywords_found = []
                abstract = pub_info['bib'].get('abstract', '')

                # Search for subject keywords in both title and abstract
                for keyword in subject_keywords:
                    if keyword.lower() in title.lower() or keyword.lower() in abstract.lower():
                        subject_keywords_found.append(keyword.capitalize())

                subject = ', '.join(subject_keywords_found) if subject_keywords_found else 'Unknown Subject'

                # Extract research method (based on keywords in title or abstract)
                research_methods_found = []
                for keyword in research_method_keywords:
                    if keyword.lower() in title.lower() or keyword.lower() in abstract.lower():
                        research_methods_found.append(keyword.capitalize())

                research_method = ', '.join(research_methods_found) if research_methods_found else 'Unknown Method'

                # Write the data to the CSV file
                writer.writerow([author['name'], title, year, cited_by, subject, research_method])

                # Add a small delay between requests to avoid overwhelming Google Scholar
                time.sleep(2)  # 2-second delay
        except Exception as e:
            print(f"Error fetching data for {query}: {e}")
            continue  # Skip to the next query if there’s an error

print("Data exported to 'google_scholar_data.csv'")

