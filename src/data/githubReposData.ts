export interface OSINTRepoInfo {
  name: string;
  repo: string;
  author: string;
  description: string;
  jsonEndpoint: string;
  jsonType: 'WhatsMyName Sites' | 'Sherlock Sites' | 'ARF Framework Tree' | 'Phone Formats' | 'Dork Signatures';
  starsApprox: string;
  keyFeatures: string[];
  githubUrl: string;
}

export const POPULAR_OSINT_JSON_REPOS: OSINTRepoInfo[] = [
  {
    name: 'WhatsMyName Data',
    repo: 'WebBreacher/WhatsMyName',
    author: 'WebBreacher (Micah Hoffman)',
    description: 'The definitive JSON dataset for finding usernames across 700+ websites. Contains validation regex, error status codes, error strings, and URI patterns.',
    jsonEndpoint: 'https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json',
    jsonType: 'WhatsMyName Sites',
    starsApprox: '6.2k+',
    keyFeatures: [
      'Over 700 verified website schemas',
      'e_code, m_code, and string signature matching',
      'Directly parsed by custom OSINT scripts and web tools',
      'Actively maintained by community PRs',
    ],
    githubUrl: 'https://github.com/WebBreacher/WhatsMyName',
  },
  {
    name: 'Sherlock Project Site List',
    repo: 'sherlock-project/sherlock',
    author: 'sherlock-project',
    description: 'The JSON database powering the famous Sherlock CLI tool. Contains over 400 social media site targets, check URLs, error types (message, status_code, response_url), and regex.',
    jsonEndpoint: 'https://raw.githubusercontent.com/sherlock-project/sherlock/master/sherlock_project/resources/data.json',
    jsonType: 'Sherlock Sites',
    starsApprox: '58k+',
    keyFeatures: [
      'Comprehensive social network coverage',
      'Supports message-based and status-code based validation',
      'Includes regex username format constraints',
      'Widely used in digital forensics & intelligence units',
    ],
    githubUrl: 'https://github.com/sherlock-project/sherlock',
  },
  {
    name: 'OSINT Framework (ARF Data)',
    repo: 'lockfale/OSINT-Framework',
    author: 'lockfale',
    description: 'The hierarchical JSON tree database powering the legendary OSINTFramework.com web mindmap. Organizes thousands of free tools by investigation phase.',
    jsonEndpoint: 'https://raw.githubusercontent.com/lockfale/OSINT-Framework/master/public/arf.json',
    jsonType: 'ARF Framework Tree',
    starsApprox: '14k+',
    keyFeatures: [
      'Recursive tree categorization (Domains, IPs, People, Social, Darkweb, etc.)',
      'Tags tools by Free, Registration, API, and Dorks',
      'Canonical reference index for intelligence professionals',
      'Instant queryable hierarchical taxonomy',
    ],
    githubUrl: 'https://github.com/lockfale/OSINT-Framework',
  },
  {
    name: 'Maigret Profile Search',
    repo: 'soxoj/maigret',
    author: 'soxoj',
    description: 'Advanced Sherlock fork with recursive metadata parsing, tags, and rich target definitions with over 2,500 sites.',
    jsonEndpoint: 'https://raw.githubusercontent.com/soxoj/maigret/main/maigret/resources/data.json',
    jsonType: 'Sherlock Sites',
    starsApprox: '11k+',
    keyFeatures: [
      'Deep account correlation',
      'Support for user IDs, UUIDs, and handles',
      'JSON reporting export',
      'Multi-engine verification',
    ],
    githubUrl: 'https://github.com/soxoj/maigret',
  },
  {
    name: 'GitHub Dorks List',
    repo: 'techgaun/github-dorks',
    author: 'techgaun',
    description: 'Curated list of GitHub dork search queries for secret hunting, private key discovery, and vulnerability assessment.',
    jsonEndpoint: 'https://raw.githubusercontent.com/techgaun/github-dorks/master/github-dorks.txt',
    jsonType: 'Dork Signatures',
    starsApprox: '4.8k+',
    keyFeatures: [
      '100+ precision search strings for GitHub API and web search',
      'Categorized by cloud providers, databases, and tokens',
      'Directly applicable to red team & blue team assessments',
    ],
    githubUrl: 'https://github.com/techgaun/github-dorks',
  },
];
