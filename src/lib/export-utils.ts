import { Conversation, Message } from './types';
import { downloadFile } from './utils';

export function exportToMarkdown(conversation: Conversation): void {
  let md = `# ${conversation.title}\n\n`;
  md += `*Tanggal: ${new Date(conversation.createdAt).toLocaleDateString('id-ID')}*\n\n---\n\n`;

  for (const msg of conversation.messages) {
    if (msg.role === 'system') continue;
    const label = msg.role === 'user' ? '👤 **Kamu**' : '🤖 **AI Tutor**';
    md += `${label}\n\n${msg.content}\n\n---\n\n`;
  }

  downloadFile(md, `${conversation.title}.md`, 'text/markdown');
}

export function exportToPDF(conversation: Conversation): void {
  const content = document.createElement('div');
  content.style.padding = '40px';
  content.style.fontFamily = 'Arial, sans-serif';
  content.style.maxWidth = '800px';
  content.style.margin = '0 auto';

  content.innerHTML = `
    <h1 style="color: #6366F1; margin-bottom: 8px;">${conversation.title}</h1>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Tanggal: ${new Date(conversation.createdAt).toLocaleDateString('id-ID')}</p>
    <hr style="border: 1px solid #e5e7eb; margin-bottom: 24px;">
    ${conversation.messages
      .filter(m => m.role !== 'system')
      .map(msg => {
        const isUser = msg.role === 'user';
        return `
          <div style="margin-bottom: 20px; padding: 16px; border-radius: 12px; background: ${isUser ? '#f0f0ff' : '#f0fdf4'};">
            <strong style="color: ${isUser ? '#6366F1' : '#16a34a'};">${isUser ? '👤 Kamu' : '🤖 AI Tutor'}</strong>
            <div style="margin-top: 8px; line-height: 1.6; white-space: pre-wrap;">${msg.content}</div>
          </div>
        `;
      })
      .join('')}
  `;

  document.body.appendChild(content);

  import('html2pdf.js').then((html2pdf) => {
    const opt = {
      margin: 10,
      filename: `${conversation.title}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    html2pdf.default().set(opt).from(content).save().then(() => {
      document.body.removeChild(content);
    });
  });
}
