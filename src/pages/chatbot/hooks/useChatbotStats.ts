import { useMemo, useState } from "react";
import { handledQuestionsStore, messagesStore, sessionsStore } from "@/mocks/chatbot";
import {
  byUseCase,
  computeStats,
  dailySeries,
  dislikedReplies,
  filterLog,
  unrecognizedQuestions,
  type ChannelFilter,
  type Period,
} from "@/pages/chatbot/chatbot.stats";

export function useChatbotStats() {
  const sessions = sessionsStore.use();
  const messages = messagesStore.use();
  const handled = handledQuestionsStore.use();
  const [period, setPeriod] = useState<Period>(30);
  const [channel, setChannel] = useState<ChannelFilter>("ALL");

  const data = useMemo(() => {
    const log = filterLog(sessions, messages, { days: period, channel });
    return {
      stats: computeStats(log.sessions, log.messages),
      daily: dailySeries(log.messages),
      useCases: byUseCase(log.messages),
      unrecognized: unrecognizedQuestions(log.messages).map((q) => ({
        ...q,
        handled: handled[q.question],
      })),
      disliked: dislikedReplies(log.messages),
    };
  }, [sessions, messages, handled, period, channel]);

  return { ...data, period, setPeriod, channel, setChannel, sessions, messages };
}
