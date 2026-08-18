import React from 'react';
import {
  ShieldCheck,
  CheckCircle,
  RotateCw,
  Gem,
  Gift,
  Calendar,
  Wrench,
  Zap,
  Heart,
  AlertCircle,
  Lock,
  Star,
  Verified,
} from 'lucide-react';

interface IconMap {
  [key: string]: React.ComponentType<{ className?: string }>;
}

const ICON_MAP: IconMap = {
  shield: ShieldCheck,
  verified: Verified,
  check_circle: CheckCircle,
  check: CheckCircle,
  autorenew: RotateCw,
  rings: Gem,
  card_giftcard: Gift,
  schedule: Calendar,
  build: Wrench,
  bolt: Zap,
  heart: Heart,
  warning: AlertCircle,
  lock: Lock,
  star: Star,
};

interface WarrantyRendererProps {
  text: string;
}

export const WarrantyRenderer: React.FC<WarrantyRendererProps> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Linha vazia
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Título em bold com ícone [icon:nome] **Texto**
        if (trimmed.includes('[icon:') && trimmed.includes('**')) {
          const iconMatch = trimmed.match(/\[icon:(\w+)\]/);
          const textMatch = trimmed.match(/\*\*(.*?)\*\*/);
          const iconName = iconMatch?.[1] || 'shield';
          const titleText = textMatch?.[1] || '';
          const Icon = ICON_MAP[iconName] || ShieldCheck;

          return (
            <div key={idx} className="flex items-start gap-2">
              <Icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-semibold text-amber-300">{titleText}</span>
            </div>
          );
        }

        // Ícone com texto normal [icon:nome] Texto
        if (trimmed.includes('[icon:')) {
          const iconMatch = trimmed.match(/\[icon:(\w+)\]/);
          const iconName = iconMatch?.[1] || 'shield';
          const Icon = ICON_MAP[iconName] || ShieldCheck;
          const restText = trimmed.replace(/\[icon:\w+\]/, '').trim();

          // Se tem bold no texto, renderizar com formatação
          const hasBold = restText.includes('**');
          if (hasBold) {
            const parts = restText.split(/\*\*(.*?)\*\*/);
            return (
              <div key={idx} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  {parts.map((part, i) =>
                    i % 2 === 1 ?
                      <span key={i} className="font-semibold text-amber-300">{part}</span> :
                      <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{restText}</span>
            </div>
          );
        }

        // Bullet point com hífen - Texto
        if (trimmed.startsWith('-')) {
          const bulletText = trimmed.substring(1).trim();

          // Verificar se tem bold
          const hasBold = bulletText.includes('**');
          if (hasBold) {
            const parts = bulletText.split(/\*\*(.*?)\*\*/);
            return (
              <div key={idx} className="flex items-start gap-2 ml-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <div>
                  {parts.map((part, i) =>
                    i % 2 === 1 ?
                      <span key={i} className="font-semibold text-amber-300">{part}</span> :
                      <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{bulletText}</span>
            </div>
          );
        }

        // Título em bold **Texto:**
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          const titleText = trimmed.replace(/\*\*/g, '');
          return (
            <div key={idx} className="font-semibold text-amber-300 mt-2">
              {titleText}
            </div>
          );
        }

        // Texto normal com possível bold no meio
        const hasBold = trimmed.includes('**');
        if (hasBold) {
          const parts = trimmed.split(/\*\*(.*?)\*\*/);
          return (
            <p key={idx}>
              {parts.map((part, i) =>
                i % 2 === 1 ?
                  <span key={i} className="font-semibold text-amber-300">{part}</span> :
                  <span key={i}>{part}</span>
              )}
            </p>
          );
        }

        // Texto normal
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
};
