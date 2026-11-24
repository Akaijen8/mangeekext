const mangayomiSources = [{
  id: 123456789,
  name: "Mangeek",
  lang: "pt",
  baseUrl: "http://geekstations.com.br/api/v2/pt",
  apiUrl: "http://geekstations.com.br/api/v2/pt",
  iconUrl: "https://www.google.com/s2/favicons?sz=128&domain=geekstations.com.br",
  typeSource: "single",
  itemType: 0,
  isNsfw: false,
  version: "0.1.2",
  pkgPath: "manga/src/pt/mangeek.js"
}];

function md5(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const bytes = [];
  for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
  const len = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bits = len * 8;
  for (let i = 0; i < 8; i++) bytes.push(i < 4 ? (bits >>> (8 * i)) & 0xff : 0);
  const K = [], S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let o = 0; o < bytes.length; o += 64) {
    const M = [];
    for (let i = 0; i < 16; i++)
      M[i] = bytes[o+i*4] | (bytes[o+i*4+1] << 8) | (bytes[o+i*4+2] << 16) | (bytes[o+i*4+3] << 24);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5*i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3*i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7*i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      const s = S[(i >> 4) * 4 + (i % 4)];
      B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  return [a0, b0, c0, d0].map(n => {
    let h = "";
    for (let i = 0; i < 4; i++) h += ((n >>> (8 * i)) & 0xff).toString(16).padStart(2, "0");
    return h;
  }).join("");
}
class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }
  signedUrl(route, input = null) {
    const nonce = Date.now().toString(16).toUpperCase();
    const key = md5(`M<${input ?? nonce}#MANG33K>D`);
    const parts = [this.source.apiUrl, route, nonce];
    if (input !== null) parts.push(input);
    parts.push(key);
    return parts.join("/");
  }

  async request(route, input = null, method = "GET", body = null) {
    const url = this.signedUrl(route, input);
    const headers = { "Content-Type": "application/json" };
    const res = method === "POST"
      ? await this.client.post(url, headers, JSON.stringify(body))
      : await this.client.get(url, headers);
    return JSON.parse(res.body);
  }

  normalizeImage(img) {
    if (!img) return "";
    return img.startsWith("http") ? img : "https://geekstations.com.br" + img;
  }
  parseList(mangas) {
    const list = mangas.map(m => ({
      name: m.title,
      link: String(m.id),
      imageUrl: this.normalizeImage(m.thumbnail),
    }));
    return { list, hasNextPage: false };
  }
  async search(query, page, filters) {
    const res = await this.request(
      "search", query.trim().toLowerCase(), "POST", { tags: [] }
    );
    console.log(JSON.stringify(res).slice(0, 500));
    return this.parseList(Array.isArray(res) ? res : res.data || []);
  }
  
  async getPopular(page) {
    const res =await this.request(
      "home"
    )
    console.log(JSON.stringify(res).slice(0,500))
    const list = res.tops;
    const categories = res.categories
    categories.forEach(manga => {
    list.push(...manga.list);
    });
    list.push(...res.trending);
    list.push(...res.news);
    list.push(...res.reading);
    return this.parseList(list);
  }
  async getLatestUpdates(page) {
    return this.search("", page, []);
  }

  async getDetail(url) { 
    const id =url;
    const res = await this.request(
      "manga", id
    )
    const a = res.attributes;
    const name = (res.title || "")
    const description =(res.description || "")
    const genres = res.tags || [];
    const chapters = (res.chapters || []).map(chapter => ({
      name: chapter.title,
      url: String(chapter.id),
      scanlator: "mangeek",
      dateUpload: ""
    }));
    return{
      "name": name,
      "description": description,
      "genres": genres,
      "chapters": chapters,
    }
   }
  async getPageList(url) {
  const res = await this.request("chapter", url);

  const pages = (res.pages || []).map(page => ({
    url: page;
  }));

  return pages;
}
  getFilterList() { return []; }
  getSourcePreferences() { return []; }
}
