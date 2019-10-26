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
  author: string;
  branch: string;
  baseBranch: string;
}
