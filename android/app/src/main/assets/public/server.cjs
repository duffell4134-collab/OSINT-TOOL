var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "10mb" }));
var getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/osint/username-check", async (req, res) => {
  try {
    const { username, target } = req.body;
    if (!username || !target || !target.uri_check) {
      return res.status(400).json({ error: "Username and target schema are required" });
    }
    const checkUrl = target.uri_check.replace(/\{account\}/g, encodeURIComponent(username));
    const prettyUrl = (target.uri_pretty || target.uri_check).replace(/\{account\}/g, encodeURIComponent(username));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6e3);
    try {
      const response = await fetch(checkUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timeoutId);
      const status = response.status;
      let text = "";
      try {
        text = await response.text();
      } catch (err) {
        text = "";
      }
      let exists = false;
      let reason = "";
      if (target.m_string && text.includes(target.m_string)) {
        exists = false;
        reason = "Missing string matched";
      } else if (target.e_string && text.includes(target.e_string)) {
        exists = true;
        reason = "Found string matched";
      } else if (target.m_code && status === target.m_code) {
        exists = false;
        reason = `Missing status code ${status}`;
      } else if (target.e_code && status === target.e_code) {
        exists = true;
        reason = `Match status code ${status}`;
      } else if (status === 200) {
        exists = true;
        reason = "HTTP 200 OK";
      } else if (status === 404) {
        exists = false;
        reason = "HTTP 404 Not Found";
      } else {
        exists = false;
        reason = `HTTP status ${status}`;
      }
      return res.json({
        name: target.name,
        category: target.category,
        url: prettyUrl,
        checkUrl,
        exists,
        status,
        reason
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr.name === "AbortError";
      return res.json({
        name: target.name,
        category: target.category,
        url: prettyUrl,
        checkUrl,
        exists: false,
        status: isTimeout ? 408 : 500,
        error: isTimeout ? "Request timed out" : fetchErr.message
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/dns-lookup", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    const recordTypes = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"];
    const results = {};
    await Promise.all(
      recordTypes.map(async (type) => {
        try {
          const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=${type}`;
          const resp = await fetch(dohUrl, {
            headers: {
              "Accept": "application/dns-json"
            }
          });
          if (resp.ok) {
            const data = await resp.json();
            results[type] = data.Answer || [];
          } else {
            results[type] = [];
          }
        } catch (e) {
          results[type] = [];
        }
      })
    );
    const txtRecords = results["TXT"] || [];
    const hasSPF = txtRecords.some((r) => r.data && r.data.includes("v=spf1"));
    let hasDMARC = false;
    let dmarcData = null;
    try {
      const dmarcResp = await fetch(`https://cloudflare-dns.com/dns-query?name=_dmarc.${encodeURIComponent(cleanDomain)}&type=TXT`, {
        headers: { "Accept": "application/dns-json" }
      });
      if (dmarcResp.ok) {
        const dmarcJson = await dmarcResp.json();
        if (dmarcJson.Answer && dmarcJson.Answer.length > 0) {
          hasDMARC = true;
          dmarcData = dmarcJson.Answer[0].data;
        }
      }
    } catch (e) {
    }
    return res.json({
      domain: cleanDomain,
      records: results,
      security: {
        hasSPF,
        hasDMARC,
        dmarcRecord: dmarcData,
        mxCount: (results["MX"] || []).length
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/subdomains", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    const crtUrl = `https://crt.sh/?q=%.${encodeURIComponent(cleanDomain)}&output=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    try {
      const resp = await fetch(crtUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OSINT-Suite/1.0"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        return res.json({ domain: cleanDomain, subdomains: [], total: 0, message: "crt.sh returned non-200 status" });
      }
      const certs = await resp.json();
      const subdomainsSet = /* @__PURE__ */ new Set();
      if (Array.isArray(certs)) {
        certs.forEach((cert) => {
          if (cert.name_value) {
            const names = cert.name_value.split("\n");
            names.forEach((name) => {
              const cleaned = name.trim().toLowerCase().replace(/^\*\./, "");
              if (cleaned.endsWith(cleanDomain) && cleaned !== cleanDomain) {
                subdomainsSet.add(cleaned);
              }
            });
          }
        });
      }
      const subdomainsList = Array.from(subdomainsSet).sort();
      return res.json({
        domain: cleanDomain,
        subdomains: subdomainsList.slice(0, 200),
        totalFound: subdomainsList.length
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.json({
        domain: cleanDomain,
        subdomains: [],
        totalFound: 0,
        error: fetchErr.message || "Lookup timeout"
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/ip-lookup", async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address is required" });
    }
    const cleanIp = ip.trim();
    const apiUrl = `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,message,continent,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;
    const resp = await fetch(apiUrl);
    const data = await resp.json();
    if (data.status === "fail") {
      return res.json({
        ip: cleanIp,
        success: false,
        message: data.message || "Invalid IP or lookup failed"
      });
    }
    return res.json({
      ip: cleanIp,
      success: true,
      data: {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        zip: data.zip,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        org: data.org,
        as: data.as,
        asname: data.asname,
        reverseDns: data.reverse,
        isHosting: data.hosting,
        isProxy: data.proxy,
        isMobile: data.mobile
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/rdap-lookup", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`;
    try {
      const resp = await fetch(rdapUrl, {
        headers: { "Accept": "application/rdap+json, application/json" }
      });
      if (!resp.ok) {
        return res.json({
          domain: cleanDomain,
          success: false,
          message: `RDAP server returned status ${resp.status}`
        });
      }
      const rdapData = await resp.json();
      const events = {};
      if (Array.isArray(rdapData.events)) {
        rdapData.events.forEach((ev) => {
          if (ev.eventAction && ev.eventDate) {
            events[ev.eventAction] = ev.eventDate;
          }
        });
      }
      const nameservers = [];
      if (Array.isArray(rdapData.nameservers)) {
        rdapData.nameservers.forEach((ns) => {
          if (ns.ldhName) nameservers.push(ns.ldhName);
        });
      }
      let registrarName = "";
      if (Array.isArray(rdapData.entities)) {
        const regEntity = rdapData.entities.find((e) => e.roles && e.roles.includes("registrar"));
        if (regEntity && regEntity.vcardArray && regEntity.vcardArray[1]) {
          const fn = regEntity.vcardArray[1].find((item) => item[0] === "fn");
          if (fn) registrarName = fn[3];
        }
      }
      return res.json({
        domain: cleanDomain,
        success: true,
        data: {
          handle: rdapData.handle || "",
          registrar: registrarName || rdapData.port43 || "Unknown / Hidden",
          status: rdapData.status || [],
          registrationDate: events["registration"] || events["created"] || "Unknown",
          expirationDate: events["expiration"] || "Unknown",
          lastChangedDate: events["last changed"] || events["last update"] || "Unknown",
          nameservers
        }
      });
    } catch (fetchErr) {
      return res.json({
        domain: cleanDomain,
        success: false,
        error: fetchErr.message
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/email-recon", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email address is required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const [user, domain] = cleanEmail.split("@");
    const md5Hash = import_crypto.default.createHash("md5").update(cleanEmail).digest("hex");
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5Hash}?d=404`;
    let hasGravatar = false;
    try {
      const gravResp = await fetch(gravatarUrl, { method: "HEAD" });
      hasGravatar = gravResp.status === 200;
    } catch (e) {
      hasGravatar = false;
    }
    let mxRecords = [];
    let provider = "Custom / Unknown Mail Server";
    try {
      const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
      const resp = await fetch(dohUrl, { headers: { "Accept": "application/dns-json" } });
      if (resp.ok) {
        const data = await resp.json();
        mxRecords = data.Answer || [];
        const mxString = JSON.stringify(mxRecords).toLowerCase();
        if (mxString.includes("google.com") || mxString.includes("googlemail.com") || mxString.includes("aspmx.l.google.com")) {
          provider = "Google Workspace / Gmail";
        } else if (mxString.includes("outlook.com") || mxString.includes("microsoft.com") || mxString.includes("pphosted.com")) {
          provider = "Microsoft 365 / Outlook";
        } else if (mxString.includes("protonmail.ch") || mxString.includes("proton.me")) {
          provider = "Proton Mail (Encrypted)";
        } else if (mxString.includes("zoho.com")) {
          provider = "Zoho Mail";
        } else if (mxString.includes("icloud.com") || mxString.includes("apple.com")) {
          provider = "Apple iCloud Mail";
        } else if (mxString.includes("yahoodns.net")) {
          provider = "Yahoo Mail";
        }
      }
    } catch (e) {
    }
    const disposableDomains = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com", "throwawaymail.com", "yopmail.com", "sharklasers.com", "trashmail.com", "getairmail.com"];
    const isDisposable = disposableDomains.includes(domain);
    return res.json({
      email: cleanEmail,
      username: user,
      domain,
      gravatar: {
        hasProfile: hasGravatar,
        avatarUrl: hasGravatar ? `https://www.gravatar.com/avatar/${md5Hash}?s=200` : null,
        hash: md5Hash
      },
      infrastructure: {
        provider,
        hasMX: mxRecords.length > 0,
        mxRecords: mxRecords.map((m) => m.data),
        isDisposable
      },
      breachSearchLinks: {
        hibp: `https://haveibeenpwned.com/account/${encodeURIComponent(cleanEmail)}`,
        epieos: `https://epieos.com/?q=${encodeURIComponent(cleanEmail)}`,
        intelx: `https://intelx.io/?s=${encodeURIComponent(cleanEmail)}`,
        dehashed: `https://www.dehashed.com/search?query=${encodeURIComponent(cleanEmail)}`
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/wayback-snapshots", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL or Domain is required" });
    }
    const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}/*&output=json&limit=60&collapse=urlkey`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    try {
      const resp = await fetch(cdxUrl, {
        headers: { "User-Agent": "OSINT-Workbench/1.0" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        return res.json({ url: cleanUrl, snapshots: [], total: 0 });
      }
      const rows = await resp.json();
      if (!Array.isArray(rows) || rows.length <= 1) {
        return res.json({ url: cleanUrl, snapshots: [], total: 0 });
      }
      const headers = rows[0];
      const items = rows.slice(1).map((row) => {
        const timestamp = row[1];
        const originalUrl = row[2];
        const mimeType = row[3];
        const statusCode = row[4];
        const archiveUrl = `https://web.archive.org/web/${timestamp}/${originalUrl}`;
        return {
          timestamp,
          originalUrl,
          mimeType,
          statusCode,
          archiveUrl
        };
      });
      return res.json({
        url: cleanUrl,
        snapshots: items,
        total: items.length
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.json({ url: cleanUrl, snapshots: [], total: 0, error: fetchErr.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/github-recon", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const cleanUsername = username.trim();
    const userResp = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
      headers: {
        "User-Agent": "OSINT-Search-Suite",
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (userResp.status === 404) {
      return res.json({ success: false, message: "GitHub user not found" });
    }
    if (!userResp.ok) {
      return res.json({ success: false, message: `GitHub API error: ${userResp.status}` });
    }
    const userData = await userResp.json();
    let repos = [];
    try {
      const reposResp = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=15`, {
        headers: {
          "User-Agent": "OSINT-Search-Suite",
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (reposResp.ok) {
        const repoList = await reposResp.json();
        if (Array.isArray(repoList)) {
          repos = repoList.map((r) => ({
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            forks: r.forks_count,
            language: r.language,
            updatedAt: r.updated_at,
            htmlUrl: r.html_url
          }));
        }
      }
    } catch (e) {
    }
    return res.json({
      success: true,
      user: {
        login: userData.login,
        name: userData.name,
        avatarUrl: userData.avatar_url,
        bio: userData.bio,
        company: userData.company,
        blog: userData.blog,
        location: userData.location,
        email: userData.email,
        twitterUsername: userData.twitter_username,
        publicRepos: userData.public_repos,
        publicGists: userData.public_gists,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        htmlUrl: userData.html_url
      },
      repos
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/fetch-json", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OSINT-Suite/1.0",
          "Accept": "application/json, text/plain, */*"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        return res.status(resp.status).json({ error: `Remote server responded with ${resp.status}` });
      }
      const text = await resp.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        return res.status(400).json({ error: "The retrieved endpoint did not return valid JSON" });
      }
      return res.json({ success: true, data: parsed });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.status(500).json({ error: fetchErr.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/osint/ai-analyze", async (req, res) => {
  try {
    const { target, targetType, collectedData, investigationGoal } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets."
      });
    }
    const prompt = `You are a Senior Cyber Threat Intelligence and Open-Source Intelligence (OSINT) Investigator.
Analyze the following OSINT findings collected for target: "${target}" (Entity Type: ${targetType}).

Investigation Goal: ${investigationGoal || "Comprehensive footprint analysis, correlation identification, threat assessment, and next-step pivot recommendations."}

COLLECTED DATA / EVIDENCE:
${JSON.stringify(collectedData, null, 2)}

Provide a structured, professional OSINT Intelligence Briefing with:
1. Executive Summary & Threat Profile
2. Key Identified Artifacts & Infrastructure Footprint
3. Correlation & Pivot Vectors (e.g. usernames linked to emails, shared ASN blocks, naming conventions, archive discrepancies)
4. Recommended Specific Dorks and High-Yield Target Search Queries (Google, GitHub, Shodan)
5. OPSEC Recommendations for the investigator when pivoting on this target

Format your response in clean, elegant Markdown with structured subheadings, bullet points, and code blocks for queries.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite OSINT analyst assisting a legitimate cybersecurity researcher with publicly accessible intelligence gathering and defense."
      }
    });
    return res.json({
      success: true,
      analysis: response.text
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "AI analysis failed" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OSINT Search Suite server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
