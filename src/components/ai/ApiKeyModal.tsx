import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useSettingsStore } from '../../store/settingsStore';

const MIN_FTP = 50;
const MAX_FTP = 500;

interface SettingsFormProps {
  initialApiKey: string;
  initialFtp: number;
  onSave: (apiKey: string, ftp: number) => void;
  onCancel: () => void;
}

function SettingsForm({ initialApiKey, initialFtp, onSave, onCancel }: SettingsFormProps) {
  const [key, setKey] = useState(initialApiKey);
  const [ftpValue, setFtpValue] = useState(String(initialFtp));
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedKey = key.trim();
    if (trimmedKey && !trimmedKey.startsWith('sk-')) {
      setError('Invalid API key format. Should start with "sk-"');
      return;
    }

    const ftpNum = parseInt(ftpValue, 10);
    if (isNaN(ftpNum) || ftpNum < MIN_FTP || ftpNum > MAX_FTP) {
      setError(`FTP must be between ${MIN_FTP} and ${MAX_FTP} watts`);
      return;
    }

    onSave(trimmedKey, ftpNum);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Your FTP (Functional Threshold Power)
        </h3>
        <Input
          label="FTP (watts)"
          type="number"
          min={MIN_FTP}
          max={MAX_FTP}
          value={ftpValue}
          onChange={(e) => {
            setFtpValue(e.target.value);
            setError('');
          }}
          placeholder="e.g., 250"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Used to calculate watts from FTP percentages and for AI workout generation.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          OpenAI API Key
        </h3>
        <Input
          label="API Key"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError('');
          }}
          placeholder="sk-..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Required for AI workout generation. Stored locally in your browser.{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Get one from OpenAI
          </a>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export function ApiKeyModal() {
  const { openaiApiKey, ftp, showApiKeyModal, setOpenaiApiKey, setFtp, setShowApiKeyModal } = useSettingsStore();

  const handleSave = (apiKey: string, ftpValue: number) => {
    if (apiKey) {
      setOpenaiApiKey(apiKey);
    }
    setFtp(ftpValue);
    setShowApiKeyModal(false);
  };

  const handleClose = () => {
    setShowApiKeyModal(false);
  };

  return (
    <Modal
      isOpen={showApiKeyModal}
      onClose={handleClose}
      title="Settings"
      size="md"
    >
      {showApiKeyModal && (
        <SettingsForm
          initialApiKey={openaiApiKey}
          initialFtp={ftp}
          onSave={handleSave}
          onCancel={handleClose}
        />
      )}
    </Modal>
  );
}
