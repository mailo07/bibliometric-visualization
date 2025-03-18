import pandas as pd

# Load data from different sources
crossref_data = pd.read_csv('crossref_data_multiple_subjects.csv')
google_scholar_data = pd.read_csv('google_scholar_data.csv')
orcid_data = pd.read_csv('orcid_from_crossref.csv')
openalex_data = pd.read_csv('openalex_data.csv')

# Print the original columns for inspection
print("CrossRef Columns:", crossref_data.columns)
print("Google Scholar Columns:", google_scholar_data.columns)
print("ORCID Columns:", orcid_data.columns)
print("OpenAlex Columns:", openalex_data.columns)

# Adjust column renaming based on available columns
# CrossRef has 4 columns; Authors should map to Author Name
crossref_data = crossref_data.rename(columns={'Authors': 'Author Name'})

# Google Scholar already has correct column names, no change needed

# ORCID has ORCID ID which may not be necessary, rename others
orcid_data = orcid_data[['Author Name', 'Title', 'DOI']]

# OpenAlex has 3 columns; we'll add missing columns like Author Name and Cited By
openalex_data['Author Name'] = 'Unknown'  # Adding default value for missing author names
openalex_data['Cited By'] = 0  # Adding default citation count

# Standardize the column names across all datasets to match target schema
columns = ['Author Name', 'Title', 'Year', 'Cited By', 'DOI', 'Subject']

crossref_data['Cited By'] = 0  # Add Cited By column if missing
crossref_data['Subject'] = 'Unknown'  # Add Subject column if missing

# Ensure all datasets have the necessary columns
crossref_data = crossref_data.reindex(columns=columns)
google_scholar_data = google_scholar_data.reindex(columns=columns)
orcid_data = orcid_data.reindex(columns=columns)
openalex_data = openalex_data.reindex(columns=columns)

# Combine all datasets into one
combined_data = pd.concat([crossref_data, google_scholar_data, orcid_data, openalex_data], ignore_index=True)

# Remove duplicates based on DOI or combination of title and author
cleaned_data = combined_data.drop_duplicates(subset=['DOI', 'Title', 'Author Name'])

# Handle missing values (drop rows with missing DOI, fill others)
cleaned_data = cleaned_data.dropna(subset=['DOI'])
cleaned_data['Cited By'] = cleaned_data['Cited By'].fillna(0)
cleaned_data['Author Name'] = cleaned_data['Author Name'].fillna('Unknown Author')
cleaned_data['Title'] = cleaned_data['Title'].fillna('No Title')

# Standardize text fields
cleaned_data['Author Name'] = cleaned_data['Author Name'].str.strip().str.title()
cleaned_data['Title'] = cleaned_data['Title'].str.strip().str.title()
cleaned_data['Subject'] = cleaned_data['Subject'].str.strip().str.lower()

# Convert data types
cleaned_data['Year'] = pd.to_numeric(cleaned_data['Year'], errors='coerce')
cleaned_data['Cited By'] = pd.to_numeric(cleaned_data['Cited By'], errors='coerce')

# Filter out invalid publication years
cleaned_data = cleaned_data[(cleaned_data['Year'] >= 1800) & (cleaned_data['Year'] <= 2024)]

# Save cleaned data to CSV
cleaned_data.to_csv('cleaned_bibliometric_data.csv', index=False)

print("Data cleaning complete. Cleaned data saved to 'cleaned_bibliometric_data.csv'.")
