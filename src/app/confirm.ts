export function createConfirm() {
  return {
    confirmDelete(this: any, target: string, callback: () => void) {
      this.confirmTarget =
        target === 'projet'
          ? this.t('confirm.project')
          : target === 'source'
            ? this.t('confirm.source')
            : target === 'generation'
              ? this.t('confirm.generation')
              : target;
      this.confirmCallback = callback;
      this.confirmTrigger = document.activeElement as HTMLElement;
      this.$refs.confirmDialog?.showModal();
    },

    executeConfirm(this: any) {
      this.$refs.confirmDialog?.close();
      if (this.confirmCallback) {
        this.confirmCallback();
        this.confirmCallback = null;
      }
      if (this.confirmTrigger) {
        this.$nextTick(() => {
          try {
            this.confirmTrigger.focus();
          } catch {}
          this.confirmTrigger = null;
        });
      }
    },

    closeConfirmDialog(this: any) {
      this.$refs.confirmDialog?.close();
      this.confirmCallback = null;
      if (this.confirmTrigger) {
        this.$nextTick(() => {
          try {
            this.confirmTrigger.focus();
          } catch {}
          this.confirmTrigger = null;
        });
      }
    },

    cancelGeneration(this: any) {
      for (const controller of Object.values(this.abortControllers) as AbortController[]) {
        controller.abort();
      }
      this.abortControllers = {};
      for (const key of Object.keys(this.loading)) {
        this.loading[key] = false;
      }
      this.showToast(this.t('toast.cancelledGeneration'), 'info');
    },
  };
}
