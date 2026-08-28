export interface OSINTTool {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  description: string;
  url: string;
  free: boolean;
  pricing: 'Free' | 'Freemium' | 'Free Trial' | 'Paid';
  requiresRegistration: boolean;
  hasApi: boolean;
  tags: string[];
  opsecConsiderations?: string;
  githubUrl?: string;
}

export interface WMNTarget {
  name: string;
  category: string;
  uri_check: string;
  uri_pretty?: string;
  e_code: number;
  e_string?: string;
  m_string?: string;
  m_code?: number;
  known_accounts?: string[];
}

export interface DorkItem {
  id: string;
  title: string;
  category: 'Credentials & Keys' | 'Sensitive Files' | 'Login Portals' | 'Cloud Storage' | 'Vulnerable Servers' | 'Public Records & Emails' | 'GitHub Code';
  platform: 'Google' | 'GitHub' | 'Shodan' | 'Censys';
  queryPattern: string;
  description: string;
  example: string;
}

export interface InvestigationEntity {
  id: string;
  type: 'username' | 'domain' | 'ip' | 'email' | 'subdomain' | 'repo' | 'phone' | 'note';
  value: string;
  label: string;
  category?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  notes?: string;
  tags: string[];
}

export interface CaseNote {
  id: string;
  timestamp: string;
  content: string;
}

export interface InvestigationLink {
  source: string;
  target: string;
  relation: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  target: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  entities: InvestigationEntity[];
  notes?: CaseNote[];
  status?: 'Active' | 'Under Review' | 'Archived' | 'Concluded';
}
