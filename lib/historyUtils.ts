import { SearchHistoryEntry } from "@/store/searchStore";

export type TimeBucket = "Today" | "Yesterday" | "This Week" | "Earlier";

export interface GroupedHistory {
    title: TimeBucket;
    items: SearchHistoryEntry[];
}

export function groupHistoryByTime(history: SearchHistoryEntry[]): GroupedHistory[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const thisWeek = today - 86400000 * 7;

    const buckets: Record<TimeBucket, SearchHistoryEntry[]> = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        Earlier: [],
    };

    history.sort((a, b) => b.timestamp - a.timestamp).forEach((item) => {
        if (item.timestamp >= today) {
            buckets.Today.push(item);
        } else if (item.timestamp >= yesterday) {
            buckets.Yesterday.push(item);
        } else if (item.timestamp >= thisWeek) {
            buckets["This Week"].push(item);
        } else {
            buckets.Earlier.push(item);
        }
    });

    return [
        { title: "Today", items: buckets.Today },
        { title: "Yesterday", items: buckets.Yesterday },
        { title: "This Week", items: buckets["This Week"] },
        { title: "Earlier", items: buckets.Earlier },
    ].filter((group) => group.items.length > 0) as GroupedHistory[];
}
