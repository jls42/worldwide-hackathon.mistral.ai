import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import ffmpegPath from 'ffmpeg-static';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { collectStream } from '../helpers/audio.js';
import type { PodcastLine } from '../types.js';

const execFileAsync = promisify(execFile);

export interface TtsVoiceConfig {
  host: { id: string; name: string };
  guest: { id: string; name: string };
}

const DEFAULT_VOICES: TtsVoiceConfig = {
  host: { id: 'JdwJ7jL68CWmQZuo7KgG', name: 'Voix info IA' },
  guest: { id: 'sANWqF1bCMzR6eyZbCGw', name: 'Marie' },
};

async function concatMp3(segments: Buffer[]): Promise<Buffer> {
  if (segments.length === 1) return segments[0];

  const tmpDir = await mkdtemp(join(tmpdir(), 'eurekai-mp3-'));
  const tempFiles: string[] = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      const p = join(tmpDir, `seg_${i}.mp3`);
      await writeFile(p, segments[i]);
      tempFiles.push(p);
    }

    const listPath = join(tmpDir, 'list.txt');
    await writeFile(listPath, tempFiles.map((f) => `file '${f}'`).join('\n'));
    tempFiles.push(listPath);

    const outputPath = join(tmpDir, 'output.mp3');
    tempFiles.push(outputPath);

    await execFileAsync(ffmpegPath!, [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      '-write_xing',
      '1',
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})));
    await unlink(tmpDir).catch(() => {});
  }
}

export async function generateAudio(
  script: PodcastLine[],
  ttsModel = 'eleven_v3',
  voices?: TtsVoiceConfig,
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY non defini');

  const v = voices ?? DEFAULT_VOICES;
  const client = new ElevenLabsClient({ apiKey });
  const segments: Buffer[] = [];

  for (const line of script) {
    const voice = line.speaker === 'host' ? v.host : v.guest;
    const audioStream = await client.textToSpeech.convert(voice.id, {
      text: line.text,
      modelId: ttsModel,
      outputFormat: 'mp3_44100_128',
    });
    const audioBytes = await collectStream(audioStream as any);
    segments.push(audioBytes);
  }

  return concatMp3(segments);
}
