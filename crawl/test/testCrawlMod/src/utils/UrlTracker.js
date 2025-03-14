// src/utils/UrlTracker.js
class UrlTracker {
  constructor() {
    this.urls = new Set();
  }

  addUrl(url) {
    if (url && typeof url === 'string' && url.startsWith('http')) {
      this.urls.add(url);
      return true;
    }
    return false;
  }

  addUrlsFromLinks(links) {
    let count = 0;
    links.forEach(link => {
      if (this.addUrl(link.href)) count++;
    });
    return count;
  }

  addUrlsFromScripts(scripts) {
    let count = 0;
    scripts.forEach(script => {
      if (script.src && this.addUrl(script.src)) count++;
    });
    return count;
  }

  getAllUrls() {
    return Array.from(this.urls);
  }

  hasUrl(url) {
    return this.urls.has(url);
  }

  size() {
    return this.urls.size;
  }
}