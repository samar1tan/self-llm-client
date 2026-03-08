import { Chat, Message } from '../types';

export function exportAsJson(chat: Chat): void {
  const data = JSON.stringify(chat, null, 2);
  downloadFile(data, `${sanitizeFilename(chat.title)}.json`, 'application/json');
}

export function exportAsMarkdown(chat: Chat): void {
  const lines: string[] = [
    `# ${chat.title}`,
    '',
    `*Exported: ${new Date().toLocaleString()}*`,
    '',
    '---',
    '',
  ];

  if (chat.systemPrompt) {
    lines.push('## System Prompt', '', chat.systemPrompt, '', '---', '');
  }

  lines.push('## Conversation', '');

  chat.messages
    .filter((m) => m.role !== 'system')
    .forEach((msg: Message) => {
      const role = msg.role === 'user' ? '**User**' : '**Assistant**';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      lines.push(`### ${role} (${time})`, '', msg.content, '');
    });

  downloadFile(lines.join('\n'), `${sanitizeFilename(chat.title)}.md`, 'text/markdown');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
}
