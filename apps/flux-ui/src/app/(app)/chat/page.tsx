import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ChatPanel } from '@/components/chat/chat-panel';

export const metadata: Metadata = { title: 'Ask Flux' };

export default function ChatPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Conversation"
        title="Ask Flux"
        description={<>Answers use server-fetched evidence, read-only tools and cited knowledge. Flux cannot write or approve anything here.</>}
      />
      <ChatPanel />
    </div>
  );
}
