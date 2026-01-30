/**
 * Source-Specific Data Parsers - BMad Option 3 Enhancement
 * 
 * Renders raw intelligence data in human-readable formats
 * based on the source type.
 */
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  TrendingUp, 
  MessageSquare, 
  Globe, 
  Code, 
  Newspaper,
  Building,
  Users,
  Shield,
  Server,
  ExternalLink,
  Star,
  Clock,
  DollarSign,
  MapPin
} from "lucide-react";

// Type definitions for source data
interface JobPosting {
  title?: string;
  department?: string;
  location?: string;
  url?: string;
  posted_at?: string;
  employment_type?: string;
}

interface HackerNewsStory {
  title?: string;
  url?: string;
  points?: number;
  num_comments?: number;
  author?: string;
  created_at?: string;
}

interface NewsArticle {
  title?: string;
  description?: string;
  url?: string;
  source?: string | { name?: string };
  publishedAt?: string;
  datePublished?: string;
}

interface Technology {
  name?: string;
  tag?: string;
  categories?: string[];
  description?: string;
}

interface GitHubRepo {
  name?: string;
  full_name?: string;
  description?: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
  html_url?: string;
  updated_at?: string;
}

interface StackQuestion {
  title?: string;
  link?: string;
  score?: number;
  answer_count?: number;
  view_count?: number;
  tags?: string[];
}

// Helper function to safely get nested values
const safeGet = (obj: unknown, path: string, defaultValue: unknown = undefined): unknown => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }
  return result ?? defaultValue;
};

// ==================== GREENHOUSE JOBS ====================
export const GreenhouseJobsParser: React.FC<{ data: unknown }> = ({ data }) => {
  const jobs = (safeGet(data, 'jobs') || safeGet(data, 'data') || (Array.isArray(data) ? data : [])) as JobPosting[];
  
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return <div className="text-gray-400 italic">No job postings found</div>;
  }

  // Group by department
  const byDept: Record<string, JobPosting[]> = {};
  jobs.forEach(job => {
    const dept = job.department || 'Other';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(job);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-400 mb-3">
        <Briefcase className="h-5 w-5" />
        <span className="font-semibold">{jobs.length} Job Postings</span>
      </div>
      
      {Object.entries(byDept).slice(0, 10).map(([dept, deptJobs]) => (
        <div key={dept} className="bg-gray-900/50 rounded p-3">
          <div className="text-blue-400 font-medium mb-2">{dept} ({deptJobs.length})</div>
          <div className="space-y-1">
            {deptJobs.slice(0, 5).map((job, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{job.title}</span>
                {job.location && (
                  <span className="text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
              </div>
            ))}
            {deptJobs.length > 5 && (
              <div className="text-gray-500 text-xs">+{deptJobs.length - 5} more</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== HACKER NEWS ====================
export const HackerNewsParser: React.FC<{ data: unknown }> = ({ data }) => {
  const stories = (safeGet(data, 'stories') || safeGet(data, 'hits') || (Array.isArray(data) ? data : [])) as HackerNewsStory[];
  const totalHits = Number(safeGet(data, 'totalHits') || safeGet(data, 'nbHits') || stories.length);
  
  if (!Array.isArray(stories) || stories.length === 0) {
    return <div className="text-gray-400 italic">No Hacker News mentions found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-orange-400 mb-3">
        <TrendingUp className="h-5 w-5" />
        <span className="font-semibold">{totalHits} HN Stories</span>
      </div>
      
      {stories.slice(0, 10).map((story, i) => (
        <div key={i} className="bg-gray-900/50 rounded p-3">
          <div className="text-gray-200 font-medium mb-1">{story.title}</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-orange-400 flex items-center gap-1">
              <Star className="h-3 w-3" />
              {story.points || 0} points
            </span>
            <span className="text-blue-400 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {story.num_comments || 0} comments
            </span>
            {story.author && (
              <span className="text-gray-500">by {story.author}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== NEWS (Google/Bing) ====================
export const NewsParser: React.FC<{ data: unknown; source: string }> = ({ data, source }) => {
  const articles = (safeGet(data, 'articles') || safeGet(data, 'value') || safeGet(data, 'news') || (Array.isArray(data) ? data : [])) as NewsArticle[];
  
  if (!Array.isArray(articles) || articles.length === 0) {
    return <div className="text-gray-400 italic">No news articles found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-400 mb-3">
        <Newspaper className="h-5 w-5" />
        <span className="font-semibold">{articles.length} News Articles ({source})</span>
      </div>
      
      {articles.slice(0, 8).map((article, i) => (
        <div key={i} className="bg-gray-900/50 rounded p-3">
          <div className="text-gray-200 font-medium mb-1">{article.title}</div>
          {article.description && (
            <div className="text-gray-400 text-sm mb-2 line-clamp-2">{article.description}</div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {(typeof article.source === 'string' ? article.source : article.source?.name) && (
              <span>{typeof article.source === 'string' ? article.source : article.source?.name}</span>
            )}
            {(article.publishedAt || article.datePublished) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(article.publishedAt || article.datePublished || '').toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== BUILTWITH ====================
export const BuiltWithParser: React.FC<{ data: unknown }> = ({ data }) => {
  const technologies = (safeGet(data, 'technologies') || safeGet(data, 'Results.0.Result.Paths.0.Technologies') || []) as Technology[];
  const domain = safeGet(data, 'domain') || safeGet(data, 'Results.0.Result.Paths.0.Domain') || '';
  
  // Group technologies by category
  const byCategory: Record<string, Technology[]> = {};
  if (Array.isArray(technologies)) {
    technologies.forEach(tech => {
      const cat = (tech.categories?.[0] || tech.tag || 'Other');
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(tech);
    });
  }

  if (Object.keys(byCategory).length === 0) {
    return <div className="text-gray-400 italic">No technology data found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-cyan-400 mb-3">
        <Code className="h-5 w-5" />
        <span className="font-semibold">Technology Stack {domain && `(${domain})`}</span>
      </div>
      
      {Object.entries(byCategory).slice(0, 8).map(([category, techs]) => (
        <div key={category} className="bg-gray-900/50 rounded p-3">
          <div className="text-blue-400 font-medium mb-2">{category}</div>
          <div className="flex flex-wrap gap-2">
            {techs.slice(0, 10).map((tech, i) => (
              <Badge key={i} variant="outline" className="text-gray-300 border-gray-600">
                {tech.name || tech.tag}
              </Badge>
            ))}
            {techs.length > 10 && (
              <Badge variant="outline" className="text-gray-500 border-gray-700">
                +{techs.length - 10} more
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== GITHUB ====================
export const GitHubParser: React.FC<{ data: unknown }> = ({ data }) => {
  const repos = (safeGet(data, 'items') || safeGet(data, 'repositories') || (Array.isArray(data) ? data : [])) as GitHubRepo[];
  const org = safeGet(data, 'organization') as Record<string, unknown> | undefined;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-300 mb-3">
        <Code className="h-5 w-5" />
        <span className="font-semibold">
          {org ? `${org.name || org.login} - ` : ''}
          {repos.length} Repositories
        </span>
      </div>
      
      {org && (
        <div className="bg-gray-900/50 rounded p-3 mb-3">
          <div className="flex items-center gap-3">
            {org.avatar_url ? (
              <img src={String(org.avatar_url)} alt="" className="h-10 w-10 rounded" />
            ) : null}
            <div>
              <div className="text-white font-medium">{String(org.name || org.login || '')}</div>
              {org.description ? <div className="text-gray-400 text-sm">{String(org.description)}</div> : null}
            </div>
          </div>
        </div>
      )}
      
      {repos.slice(0, 8).map((repo, i) => (
        <div key={i} className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-400 font-medium">{repo.name}</span>
            {repo.language && (
              <Badge variant="outline" className="text-xs">{repo.language}</Badge>
            )}
          </div>
          {repo.description && (
            <div className="text-gray-400 text-sm mb-2 line-clamp-1">{repo.description}</div>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {repo.stargazers_count?.toLocaleString() || 0}
            </span>
            <span>Forks: {repo.forks_count?.toLocaleString() || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== STACK OVERFLOW ====================
export const StackOverflowParser: React.FC<{ data: unknown }> = ({ data }) => {
  const questions = (safeGet(data, 'items') || safeGet(data, 'questions') || (Array.isArray(data) ? data : [])) as StackQuestion[];
  
  if (!Array.isArray(questions) || questions.length === 0) {
    return <div className="text-gray-400 italic">No Stack Overflow questions found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-orange-500 mb-3">
        <MessageSquare className="h-5 w-5" />
        <span className="font-semibold">{questions.length} Stack Overflow Questions</span>
      </div>
      
      {questions.slice(0, 8).map((q, i) => (
        <div key={i} className="bg-gray-900/50 rounded p-3">
          <div className="text-gray-200 font-medium mb-2">{q.title}</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400">{q.score || 0} votes</span>
            <span className="text-blue-400">{q.answer_count || 0} answers</span>
            <span className="text-gray-500">{(q.view_count || 0).toLocaleString()} views</span>
          </div>
          {q.tags && q.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {q.tags.slice(0, 5).map((tag, ti) => (
                <Badge key={ti} variant="outline" className="text-xs text-blue-400 border-blue-600">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ==================== COMPANY INFO (DNB, Clearbit, etc) ====================
export const CompanyInfoParser: React.FC<{ data: unknown; source: string }> = ({ data, source }) => {
  const company = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
  
  const name = company.name || company.legalName || company.companyName || '';
  const description = company.description || company.overview || '';
  const industry = company.industry || company.primaryIndustry || '';
  const employees = company.employees || company.numberOfEmployees || company.employeeCount || '';
  const revenue = company.revenue || company.annualRevenue || '';
  const location = company.location || company.headquarters || 
    [company.city, company.state, company.country].filter(Boolean).join(', ') || '';
  const website = company.website || company.domain || '';
  const founded = company.founded || company.foundedYear || company.yearFounded || '';

  if (!name && !description) {
    return <div className="text-gray-400 italic">No company information found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-400 mb-3">
        <Building className="h-5 w-5" />
        <span className="font-semibold">Company Profile ({source})</span>
      </div>
      
      <div className="bg-gray-900/50 rounded p-4 space-y-3">
        {name && <div className="text-white text-xl font-semibold">{String(name)}</div>}
        {description && <div className="text-gray-400 text-sm">{String(description).substring(0, 300)}</div>}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {industry && (
            <div>
              <span className="text-gray-500">Industry:</span>
              <span className="text-gray-300 ml-2">{String(industry)}</span>
            </div>
          )}
          {employees && (
            <div>
              <span className="text-gray-500">Employees:</span>
              <span className="text-gray-300 ml-2">{String(employees)}</span>
            </div>
          )}
          {revenue && (
            <div>
              <span className="text-gray-500">Revenue:</span>
              <span className="text-gray-300 ml-2">{String(revenue)}</span>
            </div>
          )}
          {location && (
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="text-gray-300 ml-2">{String(location)}</span>
            </div>
          )}
          {founded && (
            <div>
              <span className="text-gray-500">Founded:</span>
              <span className="text-gray-300 ml-2">{String(founded)}</span>
            </div>
          )}
          {website && (
            <div>
              <span className="text-gray-500">Website:</span>
              <a href={String(website).startsWith('http') ? String(website) : 'https://' + website} 
                 className="text-blue-400 ml-2 hover:underline" target="_blank" rel="noopener">
                {String(website)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SECURITY (Shodan, SecurityTrails) ====================
export const SecurityParser: React.FC<{ data: unknown; source: string }> = ({ data, source }) => {
  const secData = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
  
  const ports = (secData.ports || secData.open_ports || []) as number[];
  const services = (secData.services || secData.data || []) as Record<string, unknown>[];
  const vulns = (secData.vulns || secData.vulnerabilities || []) as string[];
  const subdomains = (secData.subdomains || secData.subdomain_count || []) as string[] | number;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-red-400 mb-3">
        <Shield className="h-5 w-5" />
        <span className="font-semibold">Security Intelligence ({source})</span>
      </div>
      
      <div className="bg-gray-900/50 rounded p-4 space-y-3">
        {Array.isArray(ports) && ports.length > 0 && (
          <div>
            <div className="text-gray-400 text-sm mb-1">Open Ports ({ports.length})</div>
            <div className="flex flex-wrap gap-2">
              {ports.slice(0, 20).map((port, i) => (
                <Badge key={i} variant="outline" className="text-yellow-400 border-yellow-600">
                  {port}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {Array.isArray(vulns) && vulns.length > 0 && (
          <div>
            <div className="text-red-400 text-sm mb-1">Vulnerabilities ({vulns.length})</div>
            <div className="flex flex-wrap gap-2">
              {vulns.slice(0, 10).map((vuln, i) => (
                <Badge key={i} className="bg-red-900/50 text-red-300">
                  {String(vuln)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {typeof subdomains === 'number' ? (
          <div className="text-gray-400">
            <Server className="h-4 w-4 inline mr-1" />
            {subdomains} subdomains detected
          </div>
        ) : Array.isArray(subdomains) && subdomains.length > 0 && (
          <div>
            <div className="text-gray-400 text-sm mb-1">Subdomains ({subdomains.length})</div>
            <div className="text-gray-300 text-sm">
              {subdomains.slice(0, 10).join(', ')}
              {subdomains.length > 10 && ` +${subdomains.length - 10} more`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== PERPLEXITY DEEP RESEARCH ====================
export const PerplexityParser: React.FC<{ data: unknown }> = ({ data }) => {
  const result = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
  const answer = result.answer || result.text || result.content || '';
  const sources = (result.sources || result.citations || []) as string[];

  if (!answer) {
    return <div className="text-gray-400 italic">No Perplexity response found</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-purple-400 mb-3">
        <Globe className="h-5 w-5" />
        <span className="font-semibold">Perplexity Deep Research</span>
      </div>
      
      <div className="bg-gray-900/50 rounded p-4">
        <div className="text-gray-300 whitespace-pre-wrap text-sm">
          {String(answer).substring(0, 2000)}
          {String(answer).length > 2000 && '...'}
        </div>
        
        {Array.isArray(sources) && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-gray-500 text-xs mb-2">Sources ({sources.length})</div>
            <div className="space-y-1">
              {sources.slice(0, 5).map((src, i) => (
                <div key={i} className="text-blue-400 text-xs hover:underline truncate">
                  {String(src)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN PARSER SELECTOR ====================
export const SourceDataParser: React.FC<{ sourceName: string; data: unknown }> = ({ sourceName, data }) => {
  const name = sourceName.toLowerCase();
  
  // Select appropriate parser based on source name
  if (name.includes('greenhouse') || name.includes('jobs') || name.includes('lever')) {
    return <GreenhouseJobsParser data={data} />;
  }
  if (name.includes('hackernews') || name.includes('hacker-news') || name === 'hn') {
    return <HackerNewsParser data={data} />;
  }
  if (name.includes('google-news') || name.includes('googlenews')) {
    return <NewsParser data={data} source="Google News" />;
  }
  if (name.includes('bing-news') || name.includes('bingnews')) {
    return <NewsParser data={data} source="Bing News" />;
  }
  if (name.includes('builtwith') || name.includes('built-with')) {
    return <BuiltWithParser data={data} />;
  }
  if (name.includes('github')) {
    return <GitHubParser data={data} />;
  }
  if (name.includes('stack') || name.includes('stackoverflow')) {
    return <StackOverflowParser data={data} />;
  }
  if (name.includes('dnb') || name.includes('clearbit') || name.includes('owler') || name.includes('coresignal')) {
    return <CompanyInfoParser data={data} source={sourceName} />;
  }
  if (name.includes('shodan') || name.includes('security') || name.includes('securitytrails')) {
    return <SecurityParser data={data} source={sourceName} />;
  }
  if (name.includes('perplexity')) {
    return <PerplexityParser data={data} />;
  }
  
  // Default: show raw JSON
  return null;
};

export default SourceDataParser;
