class URLCollector {
  constructor() {
    this.urls = new Set();
  }

  add(url) {
    if (url && typeof url === 'string' && url.startsWith('http')) {
      this.urls.add(url);
      return true;
    }
    return false;
  }

  addMultiple(urls) {
    if (!Array.isArray(urls)) return 0;

    let added = 0;
    for (const url of urls) {
      if (this.add(url)) added++;
    }

    return added;
  }

  addFromLinks(links) {
    const added = links
      .filter(link => link.href && typeof link.href === 'string')
      .map(link => this.add(link.href))
      .filter(Boolean)
      .length;

    return added;
  }

  addFromScripts(scripts) {
    const added = scripts
      .filter(script => script.src && typeof script.src === 'string')
      .map(script => this.add(script.src))
      .filter(Boolean)
      .length;

    return added;
  }

  has(url) {
    return this.urls.has(url);
  }

  getUrls() {
    return this.urls;
  }

  getUrlsArray() {
    return Array.from(this.urls);
  }

  size() {
    return this.urls.size;
  }

  clear() {
    this.urls.clear();
  }
}

module.exports = { URLCollector };