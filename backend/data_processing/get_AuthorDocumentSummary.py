import pandas as pd

# Load the CSV file
cleaned_data = pd.read_csv('cleaned_bibliometric_data.csv')


# Function to get author summary from the CSV
def get_author_summary_from_csv(author_name, data):
    author_data = data[data['Author Name'] == author_name]
    publications_count = len(author_data)
    total_citations = author_data['Cited By'].sum()

    # Calculate H-index
    citations = sorted(author_data['Cited By'].tolist(), reverse=True)
    h_index = sum(1 for i, cite in enumerate(citations) if cite >= i + 1)

    return {
        'author_name': author_name,
        'publications_count': publications_count,
        'total_citations': total_citations,
        'h_index': h_index
    }


# Function to get document summary from the CSV
def get_document_summary_from_csv(document_title, data):
    document_data = data[data['Title'] == document_title]
    if not document_data.empty:
        title = document_data['Title'].values[0]
        year = document_data['Year'].values[0]
        cited_by = document_data['Cited By'].values[0]
        subject = document_data['Subject'].values[0]
        return {
            'title': title,
            'year': year,
            'cited_by': cited_by,
            'subject': subject
        }
    else:
        return "Document not found."


# Example usage: Get summaries for authors or documents
author_name = 'Albert Einstein'
author_summary = get_author_summary_from_csv(author_name, cleaned_data)
print(author_summary)

document_title = 'On the Electrodynamics of Moving Bodies'
document_summary = get_document_summary_from_csv(document_title, cleaned_data)
print(document_summary)
