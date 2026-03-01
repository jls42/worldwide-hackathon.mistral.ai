export function quizVocalComponent(gen: any) {
  return {
    gen,
    currentQ: 0,
    audioPlaying: false,
    vocalRecording: false,
    vocalRecorder: null as MediaRecorder | null,
    feedback: null as any,
    score: 0,
    finished: false,

    questions() {
      return this.gen.data || [];
    },

    playQuestion() {
      const url = this.gen.audioUrls?.[this.currentQ];
      if (!url) return;
      const audio = new Audio(url);
      this.audioPlaying = true;
      audio.onended = () => {
        this.audioPlaying = false;
      };
      audio.play();
    },

    async startVocalRecording(this: any) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.vocalRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const chunks: Blob[] = [];
        this.vocalRecorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
        this.vocalRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          await this.submitVocalAnswer(blob);
        };
        this.vocalRecorder.start();
        this.vocalRecording = true;
      } catch (e: any) {
        this.showToast(this.t('toast.micError', { error: e.message }), 'error');
      }
    },

    stopVocalRecording() {
      if (this.vocalRecorder && this.vocalRecorder.state === 'recording') {
        this.vocalRecorder.stop();
      }
      this.vocalRecording = false;
    },

    async submitVocalAnswer(this: any, blob: Blob) {
      const pid = this.currentProjectId;
      this.feedback = { loading: true };
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'answer.webm');
        formData.append('questionIndex', String(this.currentQ));
        formData.append('lang', document.documentElement.lang || 'fr');
        const res = await fetch(
          '/api/projects/' + pid + '/generations/' + this.gen.id + '/vocal-answer',
          { method: 'POST', body: formData },
        );
        if (res.ok) {
          const result = await res.json();
          this.feedback = result;
          if (result.correct) this.score++;
        } else {
          this.feedback = {
            correct: false,
            feedback: this.t('quiz.verificationError'),
            transcription: '',
          };
        }
      } catch (e: any) {
        this.feedback = {
          correct: false,
          feedback: this.t('toast.error', { error: e.message }),
          transcription: '',
        };
      }
    },

    nextQuestion(this: any) {
      this.feedback = null;
      this.currentQ++;
      if (this.currentQ >= this.questions().length) {
        this.finished = true;
      } else {
        this.$nextTick(() => this.playQuestion());
      }
    },

    resetVocalQuiz() {
      this.currentQ = 0;
      this.score = 0;
      this.finished = false;
      this.feedback = null;
    },
  };
}
