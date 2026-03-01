export function createGenerations() {
  return {
    startEditTitle(this: any, gen: any) {
      this.editingTitle = gen.id;
      this.editTitleValue = gen.title;
      this.$nextTick(() => {
        const input = document.querySelector('input[x-ref="titleInput"]') as HTMLInputElement;
        if (input) input.focus();
      });
    },

    async saveTitle(this: any, gen: any) {
      const title = this.editTitleValue.trim();
      this.editingTitle = null;
      if (!title || title === gen.title) return;
      gen.title = title;
      await fetch(this.apiBase() + '/generations/' + gen.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    },

    async deleteGen(this: any, gen: any) {
      await fetch(this.apiBase() + '/generations/' + gen.id, { method: 'DELETE' });
      this.generations = this.generations.filter((g: any) => g.id !== gen.id);
      this.showToast(this.t('toast.genDeleted'), 'info');
    },
  };
}
