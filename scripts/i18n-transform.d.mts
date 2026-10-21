import type { Plugin } from 'vite'
export default function localizationPlugin(): Plugin
export function transformLocalization(source: string, filename: string): string | null
