import { getLocale } from '../i18n/index';

export function createChat() {
  return {
    async loadChatHistory(this: any) {
      if (!this.currentProjectId) return;
      try {
        const res = await fetch(this.apiBase() + '/chat');
        if (res.ok) {
          const data = await res.json();
          this.chatMessages = data.messages || [];
        }
      } catch {}
    },

    async sendChatMessage(this: any) {
      if (!this.currentProfile?.chatEnabled) return;
      const msg = this.chatInput.trim();
      if (!msg || this.chatLoading || !this.currentProjectId) return;
      this.chatInput = '';
      this.chatMessages.push({ role: 'user', content: msg, timestamp: new Date().toISOString() });
      this.chatLoading = true;
      this.$nextTick(() => this.scrollChatBottom());

      try {
        const res = await fetch(this.apiBase() + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            lang: getLocale(),
            ageGroup: this.currentProfile?.ageGroup || 'enfant',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          this.chatMessages.push({
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toISOString(),
            generatedIds: data.generatedIds,
          });
          if (data.generations && data.generations.length > 0) {
            for (const gen of data.generations) {
              if (gen.type === 'summary' && gen.data) {
                if (!gen.data.citations) gen.data.citations = [];
                if (!gen.data.vocabulary) gen.data.vocabulary = [];
                if (!gen.data.key_points) gen.data.key_points = [];
              }
              this.initGenProps(gen);
              this.generations.push(gen);
              this.openGens[gen.id] = true;
            }
            this.showToast(this.t('toast.chatGenDone'), 'success');
          }
        } else {
          const err = await res.json();
          if (err.error === 'chat.moderationBlocked' || err.error === 'chat.ageRestricted') {
            // Remove the optimistic user message
            this.chatMessages.pop();
            this.showToast(this.t(err.error), 'error');
          } else {
            this.chatMessages.push({
              role: 'assistant',
              content: this.t('chat.errorReply'),
              timestamp: new Date().toISOString(),
            });
            this.showToast(this.t('toast.chatErrorMsg', { error: err.error || '' }), 'error');
          }
        }
      } catch {
        this.chatMessages.push({
          role: 'assistant',
          content: this.t('chat.connectionError'),
          timestamp: new Date().toISOString(),
        });
        this.showToast(this.t('toast.chatError'), 'error');
      } finally {
        this.chatLoading = false;
        this.$nextTick(() => {
          this.scrollChatBottom();
          this.refreshIcons();
        });
      }
    },

    async clearChat(this: any) {
      if (!this.currentProjectId) return;
      try {
        await fetch(this.apiBase() + '/chat', { method: 'DELETE' });
        this.chatMessages = [];
        this.showToast(this.t('toast.chatCleared'), 'info');
      } catch {}
    },

    scrollChatBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    },
  };
}
