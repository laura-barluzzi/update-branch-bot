export interface Logger {
  (message: string): void;
}

export interface Branch {
  organization: string;
  repository: string;
  branch: string;
}

export interface PullRequest {
  id: string;
  url: string;
  number: number;
  author: string;
  branch: string;
  baseBranch: string;
  organization: string;
}

export interface GitHubUsers {
  email: string;
  login: string;
}