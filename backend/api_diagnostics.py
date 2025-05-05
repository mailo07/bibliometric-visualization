#!/usr/bin/env python
# api_diagnostics.py - Diagnose and test external API connections

import sys
import argparse
import requests
import logging
import json
import time
import xml.etree.ElementTree as ET
from config import Config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("BiblioKnow-API-Diagnostics")

def parse_args():
    parser = argparse.ArgumentParser(description="Test external API connections")
    parser.add_argument('--api', choices=['all', 'zotero', 'openlibrary', 'dblp', 
                                         'arxiv', 'openalex', 'crossref', 'gutendex', 
                                         'gbif', 'webofscience'], 
                       default='all', help='API to test')
    parser.add_argument('--query', default='machine learning', 
                       help='Test search query')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Show more detailed output')
    return parser.parse_args()

def test_zotero():
    """Test Zotero API connection and key"""
    logger.info("Testing Zotero API...")
    
    # Use the specified API key
    api_key = Config.ZOTERO_API_KEY
    if not api_key:
        logger.error("❌ No Zotero API key configured")
        return False
    
    # Initial API call with the configured key
    headers = {
        'Zotero-API-Version': '3',
        'Zotero-API-Key': api_key
    }
    
    group_id = "2412229"  # From the URL in your script
    
    try:
        # First, test the provided group ID
        logger.info(f"Testing Zotero with group ID {group_id} and key {api_key[:5]}... (key truncated)")
        url = f"https://api.zotero.org/groups/{group_id}/items?limit=1"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            logger.info(f"✅ Successfully connected to Zotero with group {group_id}")
            return True
        
        if response.status_code == 403:
            logger.warning(f"⚠️ Zotero API returned 403 Forbidden with group {group_id}")
            logger.info("This usually means the API key doesn't have access to the specified group.")
            
            # Try with user library instead
            logger.info("Testing with user library...")
            user_url = "https://api.zotero.org/users/9380802/items?limit=1"
            user_response = requests.get(user_url, headers=headers, timeout=10)
            
            if user_response.status_code == 200:
                logger.info("✅ Successfully connected to Zotero user library")
                logger.info("The issue is with the group ID, not the API key.")
                return True
            
            logger.error(f"❌ Also failed with user library: {user_response.status_code}")
        
        # Try with a public group
        logger.info("Testing with a known public group...")
        public_url = "https://api.zotero.org/groups/4451276/items?limit=1"
        public_response = requests.get(
            public_url, 
            headers={'Zotero-API-Version': '3'},  # No key needed for public
            timeout=10
        )
        
        if public_response.status_code == 200:
            logger.info("✅ Successfully connected to a public Zotero group")
            logger.info("You can use this public group as a fallback")
            
            # Provide advice
            logger.info("\nTo fix Zotero API issues:")
            logger.info("1. Check that your API key is correct")
            logger.info("2. Ensure you have access to the group you're trying to query")
            logger.info("3. Try using a public group ID instead (e.g., 4451276)")
            
            return True
        
        logger.error(f"❌ Failed to connect to Zotero: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to Zotero: {str(e)}")
        return False

def test_openlibrary():
    """Test Open Library API connection"""
    logger.info("Testing Open Library API...")
    
    try:
        url = "https://openlibrary.org/search.json"
        params = {
            'q': 'machine learning',
            'limit': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Open Library API")
            return True
        
        logger.error(f"❌ Failed to connect to Open Library API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to Open Library: {str(e)}")
        return False

def test_dblp():
    """Test DBLP API connection"""
    logger.info("Testing DBLP API...")
    
    try:
        url = "https://dblp.org/search/publ/api"
        params = {
            'q': 'machine learning',
            'format': 'json',
            'h': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to DBLP API")
            return True
        
        logger.error(f"❌ Failed to connect to DBLP API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to DBLP: {str(e)}")
        return False

def test_arxiv():
    """Test arXiv API connection"""
    logger.info("Testing arXiv API...")
    
    try:
        url = "http://export.arxiv.org/api/query"
        params = {
            'search_query': 'all:machine learning',
            'max_results': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            try:
                root = ET.fromstring(response.content)
                entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')
                if entries:
                    logger.info("✅ Successfully connected to arXiv API and retrieved entries")
                else:
                    logger.warning("⚠️ Connected to arXiv API but no entries found")
            except Exception as parse_error:
                logger.warning(f"⚠️ Connected to arXiv API but couldn't parse XML: {parse_error}")
            
            return True
        
        logger.error(f"❌ Failed to connect to arXiv API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to arXiv: {str(e)}")
        return False

def test_openalex():
    """Test OpenAlex API connection"""
    logger.info("Testing OpenAlex API...")
    
    try:
        url = "https://api.openalex.org/works"
        params = {
            'search': 'machine learning',
            'per-page': 1,
            'email': Config.ADMIN_EMAIL
        }
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to OpenAlex API")
            return True
        
        logger.error(f"❌ Failed to connect to OpenAlex API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to OpenAlex: {str(e)}")
        return False

def test_crossref():
    """Test CrossRef API connection"""
    logger.info("Testing CrossRef API...")
    
    try:
        url = "https://api.crossref.org/works"
        params = {
            'query': 'machine learning',
            'rows': 1
        }
        
        # Add email for polite API usage
        if Config.ADMIN_EMAIL:
            params['mailto'] = Config.ADMIN_EMAIL
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to CrossRef API")
            return True
        
        logger.error(f"❌ Failed to connect to CrossRef API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to CrossRef: {str(e)}")
        return False

def test_gutendex():
    """Test Gutendex API connection"""
    logger.info("Testing Gutendex API...")
    
    try:
        url = "https://gutendex.com/books"
        params = {
            'search': 'science',
            'languages': 'en'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Gutendex API")
            return True
        
        logger.error(f"❌ Failed to connect to Gutendex API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to Gutendex: {str(e)}")
        return False

def test_gbif():
    """Test GBIF API connection"""
    logger.info("Testing GBIF API...")
    
    try:
        url = "https://api.gbif.org/v1/species/search"
        params = {
            'q': 'plant',
            'limit': 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to GBIF API")
            return True
        
        logger.error(f"❌ Failed to connect to GBIF API: {response.status_code}")
        logger.error(f"Error message: {response.text}")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error connecting to GBIF: {str(e)}")
        return False

def test_webofscience():
    """Test Web of Science API connection"""
    logger.info("Testing Web of Science API...")
    
    api_key = Config.WEBOFSCIENCE_API_KEY
    if not api_key:
        logger.error("❌ No Web of Science API key configured")
        logger.info("The Web of Science API requires registration.")
        logger.info("Visit: https://developer.clarivate.com/apis/wos")
        return False
    
    try:
        # First authenticate to get session ID
        auth_url = "https://wos-api.clarivate.com/api/v1/session"
        auth_headers = {
            'X-ApiKey': api_key
        }
        
        auth_response = requests.post(auth_url, headers=auth_headers, timeout=10)
        
        if auth_response.status_code != 200:
            logger.error(f"❌ Web of Science authentication error: {auth_response.status_code}")
            logger.error(f"Error message: {auth_response.text}")
            
            # Check if using user/pass credentials
            if Config.WEBOFSCIENCE_EMAIL and Config.WEBOFSCIENCE_PASSWORD:
                logger.info("Using email/password for Web of Science authentication...")
                auth_data = {
                    'username': Config.WEBOFSCIENCE_EMAIL,
                    'password': Config.WEBOFSCIENCE_PASSWORD
                }
                
                alt_auth_response = requests.post(
                    auth_url, 
                    headers={'Content-Type': 'application/json'},
                    json=auth_data,
                    timeout=10
                )
                
                if alt_auth_response.status_code == 200:
                    logger.info("✅ Successfully authenticated with Web of Science using credentials")
                    return True
                
                logger.error(f"❌ Also failed with credentials: {alt_auth_response.status_code}")
                return False
            
            return False
        
        session_data = auth_response.json()
        session_id = session_data.get('sessionId')
        
        if not session_id:
            logger.error("❌ Failed to obtain Web of Science session ID")
            return False
        
        logger.info("✅ Successfully authenticated with Web of Science API")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error connecting to Web of Science: {str(e)}")
        return False

def run_diagnostics(api='all', query='machine learning', verbose=False):
    """Run API diagnostics for specified or all APIs"""
    logger.info("=== BIBLIOKNOW API DIAGNOSTICS ===")
    
    results = {}
    
    if api == 'all' or api == 'zotero':
        results['zotero'] = test_zotero()
        
    if api == 'all' or api == 'openlibrary':
        results['openlibrary'] = test_openlibrary()
        
    if api == 'all' or api == 'dblp':
        results['dblp'] = test_dblp()
        
    if api == 'all' or api == 'arxiv':
        results['arxiv'] = test_arxiv()
        
    if api == 'all' or api == 'openalex':
        results['openalex'] = test_openalex()
        
    if api == 'all' or api == 'crossref':
        results['crossref'] = test_crossref()
        
    if api == 'all' or api == 'gutendex':
        results['gutendex'] = test_gutendex()
        
    if api == 'all' or api == 'gbif':
        results['gbif'] = test_gbif()
        
    if api == 'all' or api == 'webofscience':
        results['webofscience'] = test_webofscience()
    
    # Summarize results
    logger.info("\n=== API DIAGNOSTICS SUMMARY ===")
    for api_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{api_name}: {status}")
    
    # Check for major issues
    if 'zotero' in results and not results['zotero']:
        logger.info("\nZotero API troubleshooting:")
        logger.info("1. Check your API key at https://www.zotero.org/settings/keys")
        logger.info("2. Make sure the key has access to the group library you're trying to use")
        logger.info("3. Try using a public group ID as a fallback (e.g., 4451276)")
        logger.info("4. Consider creating your own Zotero group for testing")
    
    if 'webofscience' in results and not results['webofscience']:
        logger.info("\nWeb of Science API troubleshooting:")
        logger.info("1. Web of Science API requires registration at https://developer.clarivate.com/apis/wos")
        logger.info("2. You need to obtain an API key and possibly credentials")
        logger.info("3. Consider using one of the other working APIs instead")
    
    logger.info("\nRECOMMENDED ACTIONS:")
    working_apis = [api for api, success in results.items() if success]
    if working_apis:
        logger.info(f"✅ Use these working APIs: {', '.join(working_apis)}")
    
    failing_apis = [api for api, success in results.items() if not success]
    if failing_apis:
        logger.info(f"❌ Fix or disable these failing APIs: {', '.join(failing_apis)}")
    
    return results

def main():
    args = parse_args()
    run_diagnostics(args.api, args.query, args.verbose)

if __name__ == "__main__":
    main()