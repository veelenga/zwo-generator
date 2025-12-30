import { GitHubIcon, ScaleIcon } from '../ui/Icons';

const REPO_URL = 'https://github.com/veelenga/zwo-generator';
const LICENSE_URL = 'https://github.com/veelenga/zwo-generator/blob/main/LICENSE';
const AUTHOR_URL = 'https://github.com/veelenga';
const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              <span>Source</span>
            </a>
            <a
              href={LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ScaleIcon className="w-4 h-4" />
              <span>MIT License</span>
            </a>
          </div>
          <div>
            {CURRENT_YEAR} ZWO Generator. Built with <span className="text-red-500">&#10084;</span> by
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              veelenga
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
