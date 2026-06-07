#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import urllib.parse

def check_url(url, timeout=20):
    try:
        r = requests.head(url, allow_redirects=True, timeout=timeout)
        return r.status_code, r.headers.get('content-type')
    except Exception as e:
        return None, str(e)

candidates = [
    "https://www.teachyourmonstertoread.com/",
    "https://www.phonicsplay.co.uk/",
    "https://www.ictgames.com/phonicsF.php",
]

for page in candidates:
    print(f"\n=== {page} ===")
    try:
        html = requests.get(page, timeout=30, headers={"User-Agent":"Mozilla/5.0"}).text
    except Exception as e:
        print('fetch failed', page, e)
        continue
    soup = BeautifulSoup(html, 'html.parser')
    links = set()
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.lower().endswith(('.mp3','.wav','.ogg','.m4a')):
            links.add(urllib.parse.urljoin(page, href))
    print('audio links found:', len(links))
    for link in sorted(links):
        status, info = check_url(link)
        print(' ', link, ' -> ', status, info)
    if not links:
        print('  none; searching for "audio" paths...')
        for a in soup.find_all(['source','track','audio']):
            src = a.get('src') or a.get('data-src')
            if src:
                links.add(urllib.parse.urljoin(page, src))
        for link in sorted(links):
            status, info = check_url(link)
            print(' ', link, ' -> ', status, info)
