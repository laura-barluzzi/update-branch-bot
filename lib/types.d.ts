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
  number: number;
  author: string;
  branch: string;
  baseBranch: string;
}
