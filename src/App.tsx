import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, Upload, Trash2, Settings, Code, FileText, Check, Shield } from 'lucide-react';
import { sanitizeCode } from './lib/sanitizer';
import type { ReplacementStyle, Token } from './lib/sanitizer';

function App() {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputTokens, setOutputTokens] = useState<Token[]>([]);
  const [style, setStyle] = useState<ReplacementStyle>('asterisks');
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom words from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('customWords');
    if (saved) {
      try {
        setCustomWords(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save custom words to localStorage when changed
  useEffect(() => {
    localStorage.setItem('customWords', JSON.stringify(customWords));
  }, [customWords]);

  // Sanitize code whenever input, custom words, or style changes
  useEffect(() => {
    setOutputTokens(sanitizeCode(inputCode, customWords, style));
  }, [inputCode, customWords, style]);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim() && !customWords.includes(newWord.trim())) {
      setCustomWords([...customWords, newWord.trim()]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (word: string) => {
    setCustomWords(customWords.filter(w => w !== word));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputCode(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const getOutputString = () => {
    return outputTokens.map(t => t.value).join('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getOutputString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getOutputString()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sanitized-code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Code Sanitizer</h1>
          </div>
          <p className="text-sm text-gray-500 hidden sm:block">
            Securely remove PII, secrets, and environment details.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Settings */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-800">Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replacement Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as ReplacementStyle)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                >
                  <option value="asterisks">Asterisks (***)</option>
                  <option value="redacted">&lt;REDACTED&gt;</option>
                  <option value="type-specific">&lt;REDACTED_TYPE&gt;</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Words to Redact
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add project names, employee names, etc.
                </p>
                <form onSubmit={handleAddWord} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Add word..."
                    className="flex-1 min-w-0 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                  <button
                    type="submit"
                    disabled={!newWord.trim()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {customWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {word}
                      <button
                        onClick={() => handleRemoveWord(word)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[600px]">
          {/* Input Panel */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Original Code</h3>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.js,.ts,.json,.html,.css,.py,.java,.go,.rs,.c,.cpp"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </div>
            </div>
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Paste your code here..."
              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-0 font-mono text-sm"
              spellCheck="false"
            />
          </div>

          {/* Output Panel */}
          <div className="flex-1 flex flex-col bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-300" />
                <h3 className="font-semibold text-gray-100">Sanitized Output</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!inputCode}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm font-medium rounded-md text-gray-200 transition-colors disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!inputCode}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-sm font-medium rounded-md text-white transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <div className="flex-1 w-full p-4 overflow-auto font-mono text-sm whitespace-pre text-gray-300 bg-gray-900">
              {outputTokens.length === 0 ? (
                <span className="text-gray-600 italic">Sanitized output will appear here...</span>
              ) : (
                outputTokens.map((token, index) => {
                  if (token.type === 'redacted') {
                    return (
                      <span
                        key={index}
                        className="bg-yellow-900/50 text-yellow-300 px-1 py-0.5 rounded mx-0.5 font-bold border border-yellow-700/50"
                        title={`Redacted: ${token.ruleName}`}
                      >
                        {token.value}
                      </span>
                    );
                  }
                  return <span key={index}>{token.value}</span>;
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
