export type ParsedResume = {
  rawText: string
  fileName?: string
  skills: string[]
  titles: string[]
  seniority: 'junior' | 'mid' | 'senior' | 'lead'
  cities: string[]
  years: number
  summaryLine: string
}

const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  nextjs: 'next.js',
  'next js': 'next.js',
  'react.js': 'react',
  'node.js': 'node',
  nodejs: 'node',
  postgres: 'postgres',
  postgresql: 'postgres',
  'ci/cd': 'ci/cd',
  'machine-learning': 'machine learning',
  ml: 'machine learning',
  'ux research': 'research',
  'user research': 'research',
  'product management': 'product',
  pm: 'product',
  'react-native': 'react native',
}

export const KNOWN_SKILLS = [
  'react', 'typescript', 'javascript', 'css', 'html', 'next.js', 'node', 'graphql', 'accessibility',
  'product', 'fintech', 'sql', 'experimentation', 'design systems', 'storybook', 'figma',
  'aws', 'e-commerce', 'redux', 'testing', 'webpack', 'java', 'spring', 'api', 'cloud', 'agile',
  'kotlin', 'microservices', 'distributed systems', 'roadmaps', 'saas', 'analytics', 'stakeholder',
  'research', 'product design', 'prototyping', 'ui', 'ux', 'python', 'tableau', 'excel', 'statistics',
  'dashboards', 'marketing', 'seo', 'paid social', 'content', 'brand', 'campaigns', 'security',
  'siem', 'network', 'incident response', 'risk', 'healthcare', 'business analysis', 'requirements',
  'process', 'operations', 'customer', 'compliance', 'communication', 'c++', 'algorithms', 'linux',
  'program management', 'technical', 'growth', 'paid acquisition', 'ruby', 'rails', 'qa', 'cypress',
  'selenium', 'spark', 'airflow', 'etl', 'data warehouse', 'consulting', 'government', 'sales',
  'crm', 'negotiation', 'pipeline', 'retail', 'accounting', 'quickbooks', 'gaap', 'reconciliation',
  'finance', 'react native', 'ios', 'android', 'mobile', 'interviews', 'usability', 'customer success',
  'onboarding', 'retention', 'modeling', 'forecasting', 'sap', 'variance', 'support', 'troubleshooting',
  'writing', 'empathy', 'postgres', 'performance', 'design', 'machine learning', 'search', 'nlp',
  'ranking', 'legal', 'contracts', 'corporate', 'salesforce', 'solutions', 'demo', 'integrations',
  'management', 'leadership', 'coaching', 'hiring', 'project management', 'scrum', 'kanban',
  'docker', 'kubernetes', 'git', 'jira', 'confluence', 'powerpoint', 'word',
]

const TITLE_HINTS = [
  'engineer', 'developer', 'designer', 'manager', 'analyst', 'scientist', 'consultant',
  'specialist', 'director', 'lead', 'intern', 'coordinator', 'associate', 'counsel',
  'accountant', 'marketer', 'researcher', 'architect', 'officer',
]

const CITIES = [
  'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton', 'winnipeg',
  'waterloo', 'kitchener', 'halifax', 'victoria', 'quebec', 'mississauga', 'burnaby',
]

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w+.#/\s-]/g, ' ').replace(/\s+/g, ' ')
}

function canonicalSkill(token: string) {
  return SKILL_ALIASES[token] ?? token
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseResumeText(rawText: string, fileName?: string): ParsedResume {
  const text = rawText.trim()
  const normalized = normalize(text)
  const skills = KNOWN_SKILLS.filter((skill) => {
    const needle = escapeRegExp(skill)
    return new RegExp(`(^|\\s)${needle}(s)?(\\s|$)`, 'i').test(normalized)
  })

  const extra = Object.keys(SKILL_ALIASES).filter((alias) => normalized.includes(alias)).map(canonicalSkill)
  const uniqueSkills = Array.from(new Set([...skills, ...extra]))

  const titles = TITLE_HINTS.filter((hint) => normalized.includes(hint))
  const cities = CITIES.filter((city) => normalized.includes(city)).map((city) => city[0].toUpperCase() + city.slice(1))

  let seniority: ParsedResume['seniority'] = 'mid'
  if (/\b(intern|junior|jr|new grad|co-op|coop)\b/i.test(text)) seniority = 'junior'
  if (/\b(senior|sr\.|staff|principal)\b/i.test(text)) seniority = 'senior'
  if (/\b(lead|head of|director|manager of engineering|eng manager)\b/i.test(text)) seniority = 'lead'

  const yearMatches = text.match(/\b(20\d{2}|19\d{2})\b/g) ?? []
  const years = yearMatches.length >= 2
    ? Math.min(20, Math.max(1, Math.max(...yearMatches.map(Number)) - Math.min(...yearMatches.map(Number))))
    : /\b(\d+)\+?\s+years?\b/i.test(text)
      ? Number(text.match(/\b(\d+)\+?\s+years?\b/i)?.[1] ?? 3)
      : 3

  const firstLine = text.split(/\n/).map((line) => line.trim()).find((line) => line.length > 8) ?? 'Your resume'

  return {
    rawText: text,
    fileName,
    skills: uniqueSkills,
    titles,
    seniority,
    cities,
    years,
    summaryLine: firstLine.slice(0, 90),
  }
}

export function isReadableResumeText(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length < 40) return false
  const letters = (compact.match(/[A-Za-z]/g) ?? []).length
  const weird = (compact.match(/[^\w\s.,;:'"@&/+()%-]/g) ?? []).length
  return letters / compact.length >= 0.55 && weird / compact.length < 0.12
}

export async function extractTextFromFile(file: File) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const raw = new TextDecoder('latin1').decode(bytes)
    const chunks = [...raw.matchAll(/\((?:\\\)|[^)]){4,}\)/g)].map((match) =>
      match[0]
        .slice(1, -1)
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\[0-9]{3}/g, ' '),
    )
    const readable = chunks.filter((chunk) => /[A-Za-z]{3,}/.test(chunk)).join(' ')
    const cleaned = readable.replace(/\s+/g, ' ').trim()
    if (isReadableResumeText(cleaned)) return cleaned
    throw new Error('We could not read that PDF. You can still tell us what you want next.')
  }

  return file.text()
}

export const SAMPLE_RESUME = `Alex Chen
Toronto, ON · Frontend / Product Engineer

Experience
Senior Frontend Engineer, Northline — 2022–2026
Shipped React and TypeScript interfaces used by 80k weekly users. Built a design system, improved accessibility, and cut checkout time 18%.

Product Engineer, Harbour Apps — 2019–2022
Owned features end to end with Node, SQL, and experimentation. Partnered with design on Figma prototypes.

Skills
React, TypeScript, JavaScript, Next.js, CSS, Node, SQL, GraphQL, accessibility, product, Figma`
